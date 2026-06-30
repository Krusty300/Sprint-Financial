"use client"

import * as React from "react"

import { cn } from "@/lib/utils"

interface SliderProps {
  value: number[];
  onValueChange: (value: number[]) => void;
  min: number;
  max: number;
  step: number;
  className?: string;
}

const Slider = React.forwardRef<HTMLInputElement, SliderProps>(
  ({ className, value, onValueChange, min, max, step, ...props }, ref) => {
    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const values = e.target.value.split(',').map(v => parseInt(v.trim()));
      if (values.length === 2) {
        onValueChange(values);
      }
    };

    return (
      <div className="space-y-2">
        <input
          ref={ref}
          type="range"
          min={min}
          max={max}
          step={step}
          value={value[0]}
          onChange={(e) => {
            const newMin = parseInt(e.target.value);
            const newMax = value[1];
            onValueChange([newMin, newMax]);
          }}
          className={cn("w-full", className)}
          {...props}
        />
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={value[1]}
          onChange={(e) => {
            const newMax = parseInt(e.target.value);
            const newMin = value[0];
            onValueChange([newMin, newMax]);
          }}
          className={cn("w-full", className)}
          {...props}
        />
      </div>
    );
  }
);

Slider.displayName = "Slider";

export { Slider };
