'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { useToast } from '@/hooks/use-toast'
import { Loader2, Sparkles, Package, Cpu, Target, CheckCircle2 } from 'lucide-react'

// Common AI models for the dropdown
const AI_MODELS = [
  { id: 'gpt-4o', name: 'GPT-4o', provider: 'OpenAI' },
  { id: 'gpt-4o-mini', name: 'GPT-4o Mini', provider: 'OpenAI' },
  { id: 'gpt-4-turbo', name: 'GPT-4 Turbo', provider: 'OpenAI' },
  { id: 'gpt-3.5-turbo', name: 'GPT-3.5 Turbo', provider: 'OpenAI' },
  { id: 'claude-3-5-sonnet', name: 'Claude 3.5 Sonnet', provider: 'Anthropic' },
  { id: 'claude-3-opus', name: 'Claude 3 Opus', provider: 'Anthropic' },
  { id: 'claude-3-haiku', name: 'Claude 3 Haiku', provider: 'Anthropic' },
  { id: 'gemini-1.5-pro', name: 'Gemini 1.5 Pro', provider: 'Google' },
  { id: 'gemini-1.5-flash', name: 'Gemini 1.5 Flash', provider: 'Google' },
  { id: 'llama-3.1-70b', name: 'Llama 3.1 70B', provider: 'Meta' },
  { id: 'llama-3.1-8b', name: 'Llama 3.1 8B', provider: 'Meta' },
  { id: 'mistral-large', name: 'Mistral Large', provider: 'Mistral' },
  { id: 'mixtral-8x7b', name: 'Mixtral 8x7B', provider: 'Mistral' },
]

// Task types for use cases
const TASK_TYPES = [
  { id: 'chat', name: 'Chat / Conversation' },
  { id: 'completion', name: 'Text Completion' },
  { id: 'summarization', name: 'Summarization' },
  { id: 'extraction', name: 'Data Extraction' },
  { id: 'classification', name: 'Classification' },
  { id: 'generation', name: 'Content Generation' },
  { id: 'translation', name: 'Translation' },
  { id: 'code', name: 'Code Generation' },
  { id: 'analysis', name: 'Analysis' },
  { id: 'other', name: 'Other' },
]

interface QuickStartData {
  product: {
    name: string
    description: string
  }
  function: {
    name: string
    model_id: string
    description: string
  }
  useCase: {
    name: string
    task_type: string
    description: string
  }
}

const TOTAL_STEPS = 4

export function QuickStartWizard() {
  const router = useRouter()
  const { toast } = useToast()
  const [currentStep, setCurrentStep] = useState(1)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [data, setData] = useState<QuickStartData>({
    product: { name: '', description: '' },
    function: { name: '', model_id: '', description: '' },
    useCase: { name: '', task_type: '', description: '' },
  })

  const updateProduct = (field: keyof QuickStartData['product'], value: string) => {
    setData((prev) => ({
      ...prev,
      product: { ...prev.product, [field]: value },
    }))
  }

  const updateFunction = (field: keyof QuickStartData['function'], value: string) => {
    setData((prev) => ({
      ...prev,
      function: { ...prev.function, [field]: value },
    }))
  }

  const updateUseCase = (field: keyof QuickStartData['useCase'], value: string) => {
    setData((prev) => ({
      ...prev,
      useCase: { ...prev.useCase, [field]: value },
    }))
  }

  const canProceed = () => {
    switch (currentStep) {
      case 1:
        return data.product.name.trim().length > 0
      case 2:
        return data.function.name.trim().length > 0 && data.function.model_id.length > 0
      case 3:
        return data.useCase.name.trim().length > 0 && data.useCase.task_type.length > 0
      default:
        return true
    }
  }

  const handleNext = () => {
    if (currentStep < TOTAL_STEPS) {
      setCurrentStep(currentStep + 1)
    }
  }

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1)
    }
  }

  const handleSkip = () => {
    // Skip remaining optional steps and submit
    handleSubmit(true)
  }

  const handleSubmit = async (skipped = false) => {
    setIsSubmitting(true)

    try {
      const payload: Record<string, unknown> = {
        product: data.product,
      }

      // Include function if we're past step 2 or completed step 2
      if (currentStep >= 2 && data.function.name && data.function.model_id) {
        payload.function = data.function
      }

      // Include use case if we completed step 3
      if (!skipped && currentStep >= 3 && data.useCase.name && data.useCase.task_type) {
        payload.useCase = data.useCase
      }

      const response = await fetch('/api/quick-start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to create portfolio')
      }

      setCurrentStep(4)

      toast({
        title: 'Portfolio created!',
        description: 'Your AI portfolio has been set up successfully.',
      })
    } catch (error) {
      console.error('Quick start error:', error)
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to create portfolio',
        variant: 'destructive',
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleFinish = () => {
    router.push('/products')
    router.refresh()
  }

  // Progress indicator
  const ProgressIndicator = () => (
    <div className="flex items-center justify-center gap-2 mb-6">
      {[1, 2, 3, 4].map((step) => (
        <div
          key={step}
          className={`flex items-center ${
            step < 4 ? 'gap-2' : ''
          }`}
        >
          <div
            className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-colors ${
              step === currentStep
                ? 'bg-primary text-primary-foreground'
                : step < currentStep
                ? 'bg-primary/20 text-primary'
                : 'bg-muted text-muted-foreground'
            }`}
          >
            {step < currentStep ? (
              <CheckCircle2 className="w-4 h-4" />
            ) : (
              step
            )}
          </div>
          {step < 4 && (
            <div
              className={`w-8 h-0.5 ${
                step < currentStep ? 'bg-primary/20' : 'bg-muted'
              }`}
            />
          )}
        </div>
      ))}
    </div>
  )

  // Step 1: Welcome + Product
  const Step1 = () => (
    <>
      <CardHeader className="text-center">
        <div className="mx-auto w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
          <Package className="w-6 h-6 text-primary" />
        </div>
        <CardTitle>Welcome to ModelOptix!</CardTitle>
        <CardDescription>
          Let&apos;s set up your first AI product. This will only take a minute.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="product-name">Product Name *</Label>
          <Input
            id="product-name"
            placeholder="e.g., Customer Support Bot, Content Assistant"
            value={data.product.name}
            onChange={(e) => updateProduct('name', e.target.value)}
            autoFocus
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="product-description">Description (optional)</Label>
          <Textarea
            id="product-description"
            placeholder="Briefly describe what this product does..."
            value={data.product.description}
            onChange={(e) => updateProduct('description', e.target.value)}
            rows={3}
          />
        </div>
      </CardContent>
    </>
  )

  // Step 2: Add Function
  const Step2 = () => (
    <>
      <CardHeader className="text-center">
        <div className="mx-auto w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
          <Cpu className="w-6 h-6 text-primary" />
        </div>
        <CardTitle>Add Your First AI Function</CardTitle>
        <CardDescription>
          Functions are the AI-powered features in your product.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="function-name">Function Name *</Label>
          <Input
            id="function-name"
            placeholder="e.g., Chat Handler, Email Writer"
            value={data.function.name}
            onChange={(e) => updateFunction('name', e.target.value)}
            autoFocus
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="function-model">AI Model *</Label>
          <Select
            value={data.function.model_id}
            onValueChange={(value) => updateFunction('model_id', value)}
          >
            <SelectTrigger id="function-model">
              <SelectValue placeholder="Select the AI model you're using" />
            </SelectTrigger>
            <SelectContent>
              {AI_MODELS.map((model) => (
                <SelectItem key={model.id} value={model.id}>
                  {model.name} ({model.provider})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="function-description">Description (optional)</Label>
          <Textarea
            id="function-description"
            placeholder="What does this function do?"
            value={data.function.description}
            onChange={(e) => updateFunction('description', e.target.value)}
            rows={2}
          />
        </div>
      </CardContent>
    </>
  )

  // Step 3: Add Use Case
  const Step3 = () => (
    <>
      <CardHeader className="text-center">
        <div className="mx-auto w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
          <Target className="w-6 h-6 text-primary" />
        </div>
        <CardTitle>Define a Use Case</CardTitle>
        <CardDescription>
          Use cases help us understand how you&apos;re using this function.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="usecase-name">Use Case Name *</Label>
          <Input
            id="usecase-name"
            placeholder="e.g., Answer FAQs, Generate Reports"
            value={data.useCase.name}
            onChange={(e) => updateUseCase('name', e.target.value)}
            autoFocus
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="usecase-type">Task Type *</Label>
          <Select
            value={data.useCase.task_type}
            onValueChange={(value) => updateUseCase('task_type', value)}
          >
            <SelectTrigger id="usecase-type">
              <SelectValue placeholder="What kind of task is this?" />
            </SelectTrigger>
            <SelectContent>
              {TASK_TYPES.map((type) => (
                <SelectItem key={type.id} value={type.id}>
                  {type.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="usecase-description">Description (optional)</Label>
          <Textarea
            id="usecase-description"
            placeholder="Any additional details about this use case..."
            value={data.useCase.description}
            onChange={(e) => updateUseCase('description', e.target.value)}
            rows={2}
          />
        </div>
      </CardContent>
    </>
  )

  // Step 4: Success
  const Step4 = () => (
    <>
      <CardHeader className="text-center">
        <div className="mx-auto w-12 h-12 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center mb-4">
          <Sparkles className="w-6 h-6 text-green-600 dark:text-green-400" />
        </div>
        <CardTitle>You&apos;re All Set!</CardTitle>
        <CardDescription>
          Your AI portfolio has been created. We&apos;re analyzing your setup to find optimization opportunities.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="bg-muted/50 rounded-lg p-4 space-y-2">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-green-600" />
            <span className="text-sm">Product: {data.product.name}</span>
          </div>
          {data.function.name && (
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-green-600" />
              <span className="text-sm">Function: {data.function.name}</span>
            </div>
          )}
          {data.useCase.name && (
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-green-600" />
              <span className="text-sm">Use Case: {data.useCase.name}</span>
            </div>
          )}
        </div>
      </CardContent>
    </>
  )

  return (
    <Card className="w-full max-w-lg mx-auto">
      <ProgressIndicator />

      {currentStep === 1 && <Step1 />}
      {currentStep === 2 && <Step2 />}
      {currentStep === 3 && <Step3 />}
      {currentStep === 4 && <Step4 />}

      <CardFooter className="flex justify-between">
        {currentStep === 1 && (
          <>
            <div /> {/* Spacer */}
            <Button onClick={handleNext} disabled={!canProceed()}>
              Get Started
            </Button>
          </>
        )}

        {currentStep === 2 && (
          <>
            <Button variant="ghost" onClick={handleBack}>
              Back
            </Button>
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={handleSkip}
                disabled={isSubmitting || !canProceed()}
              >
                {isSubmitting ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  'Skip & Finish'
                )}
              </Button>
              <Button onClick={handleNext} disabled={!canProceed()}>
                Continue
              </Button>
            </div>
          </>
        )}

        {currentStep === 3 && (
          <>
            <Button variant="ghost" onClick={handleBack}>
              Back
            </Button>
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={handleSkip}
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  'Skip'
                )}
              </Button>
              <Button
                onClick={() => handleSubmit(false)}
                disabled={isSubmitting || !canProceed()}
              >
                {isSubmitting ? (
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                ) : null}
                Complete Setup
              </Button>
            </div>
          </>
        )}

        {currentStep === 4 && (
          <>
            <div /> {/* Spacer */}
            <Button onClick={handleFinish}>
              View My Portfolio
            </Button>
          </>
        )}
      </CardFooter>
    </Card>
  )
}
