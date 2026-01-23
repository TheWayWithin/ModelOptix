import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { SavingsSummary, SavingsRecordWithContext } from '@/types/savings';

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const view = searchParams.get('view') || 'summary';
    const productId = searchParams.get('product_id');

    if (view === 'summary') {
      const { data: records, error } = await supabase
        .from('savings_records')
        .select('*, products:product_id (name)')
        .eq('user_id', user.id)
        .order('switched_at', { ascending: false });

      if (error) {
        console.error('Error fetching savings:', error);
        return NextResponse.json(
          { error: 'Failed to fetch savings' },
          { status: 500 }
        );
      }

      const now = new Date();
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      const recordsThisMonth =
        records?.filter((r) => new Date(r.switched_at) >= startOfMonth) || [];

      // Group by product
      const productMap = new Map<
        string,
        { name: string; total: number; count: number }
      >();
      records?.forEach((r) => {
        if (r.product_id) {
          const existing = productMap.get(r.product_id);
          const productName =
            (r.products as { name: string } | null)?.name || 'Unknown';
          if (existing) {
            existing.total += Number(r.monthly_savings);
            existing.count += 1;
          } else {
            productMap.set(r.product_id, {
              name: productName,
              total: Number(r.monthly_savings),
              count: 1,
            });
          }
        }
      });

      const summary: SavingsSummary = {
        total_lifetime_savings:
          records?.reduce((sum, r) => sum + Number(r.monthly_savings), 0) || 0,
        monthly_savings:
          records?.reduce((sum, r) => sum + Number(r.monthly_savings), 0) || 0,
        savings_this_month: recordsThisMonth.reduce(
          (sum, r) => sum + Number(r.monthly_savings),
          0
        ),
        total_switches: records?.length || 0,
        switches_this_month: recordsThisMonth.length,
        savings_by_product: Array.from(productMap.entries()).map(
          ([id, data]) => ({
            product_id: id,
            product_name: data.name,
            total_savings: data.total,
            switch_count: data.count,
          })
        ),
      };

      return NextResponse.json({ summary });
    }

    // View = history (monthly data for charts)
    if (view === 'history') {
      const months = parseInt(searchParams.get('months') || '12', 10);
      const startDate = new Date();
      startDate.setMonth(startDate.getMonth() - months);

      const { data: records, error } = await supabase
        .from('savings_records')
        .select('monthly_savings, switched_at')
        .eq('user_id', user.id)
        .gte('switched_at', startDate.toISOString())
        .order('switched_at', { ascending: true });

      if (error) {
        console.error('Error fetching savings history:', error);
        return NextResponse.json(
          { error: 'Failed to fetch history' },
          { status: 500 }
        );
      }

      // Aggregate by month
      const monthlyData = new Map<string, { savings: number; switches: number }>();

      // Initialize all months with zero
      for (let i = months - 1; i >= 0; i--) {
        const date = new Date();
        date.setMonth(date.getMonth() - i);
        const monthKey = date.toISOString().slice(0, 7); // YYYY-MM
        monthlyData.set(monthKey, { savings: 0, switches: 0 });
      }

      // Fill in actual data
      records?.forEach((r) => {
        const monthKey = new Date(r.switched_at).toISOString().slice(0, 7);
        const existing = monthlyData.get(monthKey);
        if (existing) {
          existing.savings += Number(r.monthly_savings);
          existing.switches += 1;
        }
      });

      // Calculate cumulative savings
      let cumulative = 0;
      const history = Array.from(monthlyData.entries()).map(([month, data]) => {
        cumulative += data.savings;
        return {
          month,
          monthLabel: new Date(month + '-01').toLocaleDateString('en-US', {
            month: 'short',
            year: 'numeric',
          }),
          savings: data.savings,
          switches: data.switches,
          cumulative,
        };
      });

      return NextResponse.json({ history });
    }

    // View = records (detailed list)
    let query = supabase
      .from('savings_records')
      .select('*, products:product_id (name), functions:function_id (name)')
      .eq('user_id', user.id)
      .order('switched_at', { ascending: false });

    if (productId) {
      query = query.eq('product_id', productId);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching savings records:', error);
      return NextResponse.json(
        { error: 'Failed to fetch records' },
        { status: 500 }
      );
    }

    const records: SavingsRecordWithContext[] =
      data?.map((r) => ({
        ...r,
        product_name: (r.products as { name: string } | null)?.name,
        function_name: (r.functions as { name: string } | null)?.name,
        products: undefined,
        functions: undefined,
      })) || [];

    return NextResponse.json({ records });
  } catch (error) {
    console.error('Savings GET error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
