import * as React from "react"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { Check, X, Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"

type FormState = "idle" | "loading" | "success"

interface PopoverFormProps {
  title: string
  open: boolean
  setOpen: (open: boolean) => void
  width?: string
  height?: string | "auto"
  showCloseButton?: boolean
  showSuccess?: boolean
  openChild: React.ReactNode
  successChild: React.ReactNode
  trigger?: React.ReactNode
}

const PopoverForm = React.forwardRef<HTMLDivElement, PopoverFormProps>(
  ({ 
    title, 
    open, 
    setOpen, 
    width = "364px", 
    height = "192px", 
    showCloseButton = true, 
    showSuccess = false,
    openChild,
    successChild,
    trigger
  }, ref) => {
    const isAutoHeight = height === "auto";
    
    return (
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          {trigger}
        </PopoverTrigger>
        <PopoverContent 
          ref={ref}
          className={cn(
            "p-0 border-0 shadow-lg bg-white",
            "data-[state=open]:animate-in data-[state=closed]:animate-out",
            "data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",
            "data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95"
          )}
          style={{ 
            width, 
            ...(isAutoHeight ? {} : { height })
          }}
        >
          <div className={cn("relative", isAutoHeight ? "" : "h-full")}>
            {showCloseButton && !showSuccess && (
              <button
                onClick={() => setOpen(false)}
                className="absolute top-2 right-2 z-10 p-1 rounded-full hover:bg-gray-100 transition-colors"
              >
                <X className="h-4 w-4 text-gray-500" />
              </button>
            )}
            
            {showSuccess ? successChild : openChild}
          </div>
        </PopoverContent>
      </Popover>
    )
  }
)
PopoverForm.displayName = "PopoverForm"

interface PopoverFormButtonProps {
  loading?: boolean
  children?: React.ReactNode
  className?: string
}

const PopoverFormButton = React.forwardRef<HTMLButtonElement, PopoverFormButtonProps>(
  ({ loading = false, children = "Submit", className, ...props }, ref) => {
    return (
      <Button
        ref={ref}
        type="submit"
        disabled={loading}
        className={cn(
          "w-full h-10 bg-[#61936f] hover:bg-[#4a7a5a] text-white font-medium",
          "disabled:opacity-50 disabled:cursor-not-allowed",
          className
        )}
        {...props}
      >
        {loading ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          children
        )}
      </Button>
    )
  }
)
PopoverFormButton.displayName = "PopoverFormButton"

const PopoverFormSeparator = React.forwardRef<HTMLDivElement, React.ComponentPropsWithoutRef<typeof Separator>>(
  ({ className, ...props }, ref) => {
    return (
      <Separator
        ref={ref}
        className={cn("w-full bg-gray-200", className)}
        {...props}
      />
    )
  }
)
PopoverFormSeparator.displayName = "PopoverFormSeparator"

const PopoverFormCutOutLeftIcon = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          "w-3 h-3 bg-white border-l border-t border-gray-200 rounded-tl-full",
          className
        )}
        {...props}
      />
    )
  }
)
PopoverFormCutOutLeftIcon.displayName = "PopoverFormCutOutLeftIcon"

const PopoverFormCutOutRightIcon = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          "w-3 h-3 bg-white border-r border-t border-gray-200 rounded-tr-full",
          className
        )}
        {...props}
      />
    )
  }
)
PopoverFormCutOutRightIcon.displayName = "PopoverFormCutOutRightIcon"

interface PopoverFormSuccessProps {
  title: string
  description: string
  className?: string
}

const PopoverFormSuccess = React.forwardRef<HTMLDivElement, PopoverFormSuccessProps>(
  ({ title, description, className, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          "flex flex-col items-center justify-center h-full p-6 text-center",
          className
        )}
        {...props}
      >
        <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mb-4">
          <Check className="h-6 w-6 text-green-600" />
        </div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">{title}</h3>
        <p className="text-sm text-gray-600">{description}</p>
      </div>
    )
  }
)
PopoverFormSuccess.displayName = "PopoverFormSuccess"

export {
  PopoverForm,
  PopoverFormButton,
  PopoverFormCutOutLeftIcon,
  PopoverFormCutOutRightIcon,
  PopoverFormSeparator,
  PopoverFormSuccess,
} 