import * as React from "react";
import { cn } from "@/lib/utils";
import { Button } from "./button";
import { Minus, Plus } from "lucide-react";

interface NumberInputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'onChange'> {
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  step?: number;
  showControls?: boolean;
}

const NumberInput = React.forwardRef<HTMLInputElement, NumberInputProps>(
  ({ className, value, onChange, min = 0, max = Infinity, step = 1, showControls = true, ...props }, ref) => {
    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const newValue = parseInt(e.target.value) || min;
      onChange(Math.max(min, Math.min(max, newValue)));
    };

    const increment = () => {
      onChange(Math.min(max, value + step));
    };

    const decrement = () => {
      onChange(Math.max(min, value - step));
    };

    return (
      <div className={cn("flex items-center", className)}>
        {showControls && (
          <Button
            type="button"
            variant="outline"
            size="icon"
            className="h-10 w-10 rounded-r-none"
            onClick={decrement}
            disabled={value <= min}
            tabIndex={-1}
          >
            <Minus className="h-4 w-4" />
          </Button>
        )}
        <input
          type="number"
          inputMode="numeric"
          pattern="[0-9]*"
          value={value}
          onChange={handleChange}
          min={min}
          max={max}
          step={step}
          className={cn(
            "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-base text-center ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
            showControls && "rounded-l-none rounded-r-none border-l-0 border-r-0",
          )}
          ref={ref}
          {...props}
        />
        {showControls && (
          <Button
            type="button"
            variant="outline"
            size="icon"
            className="h-10 w-10 rounded-l-none"
            onClick={increment}
            disabled={value >= max}
            tabIndex={-1}
          >
            <Plus className="h-4 w-4" />
          </Button>
        )}
      </div>
    );
  }
);

NumberInput.displayName = "NumberInput";

export { NumberInput }; 