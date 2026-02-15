import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'

// Validation schema for quick start data
const quickStartSchema = z.object({
  product: z.object({
    name: z.string().min(1, 'Product name is required').max(100),
    description: z.string().max(500).optional(),
  }),
  function: z.object({
    name: z.string().min(1, 'Function name is required').max(100),
    model_id: z.string().min(1, 'Model selection is required'),
    description: z.string().max(500).optional(),
  }).optional(),
  useCase: z.object({
    name: z.string().min(1, 'Use case name is required').max(100),
    task_type: z.string().min(1, 'Task type is required'),
    description: z.string().max(1000).optional(),
  }).optional(),
})

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()

    // Get authenticated user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Parse and validate request body
    const body = await request.json()
    const validationResult = quickStartSchema.safeParse(body)

    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: validationResult.error.flatten() },
        { status: 400 }
      )
    }

    const { product, function: func, useCase } = validationResult.data

    // Create product
    const { data: createdProduct, error: productError } = await supabase
      .from('products')
      .insert({
        name: product.name,
        description: product.description || null,
        user_id: user.id,
      })
      .select()
      .single()

    if (productError) {
      console.error('Error creating product:', productError)
      return NextResponse.json(
        { error: 'Failed to create product' },
        { status: 500 }
      )
    }

    let createdFunction = null
    let createdUseCase = null

    // Create function if provided
    if (func) {
      const { data: funcData, error: funcError } = await supabase
        .from('functions')
        .insert({
          name: func.name,
          description: func.description || null,
          model_id: func.model_id,
          product_id: createdProduct.id,
        })
        .select()
        .single()

      if (funcError) {
        console.error('Error creating function:', funcError)
        // Don't fail the whole operation, product was created
      } else {
        createdFunction = funcData

        // Create use case if provided and function was created
        if (useCase && createdFunction) {
          const { data: useCaseData, error: useCaseError } = await supabase
            .from('use_cases')
            .insert({
              name: useCase.name,
              task_type: useCase.task_type,
              description: useCase.description || null,
              function_id: createdFunction.id,
            })
            .select()
            .single()

          if (useCaseError) {
            console.error('Error creating use case:', useCaseError)
            // Don't fail the whole operation
          } else {
            createdUseCase = useCaseData
          }
        }
      }
    }

    return NextResponse.json({
      success: true,
      product: createdProduct,
      function: createdFunction,
      useCase: createdUseCase,
    })
  } catch (error) {
    console.error('Quick start error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
