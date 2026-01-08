import { useState } from 'react'
import './ColorPicker.css'

interface ColorPickerProps {
  value: string
  onChange: (color: string) => void
}

const PRESET_COLORS = [
  '#FF6B6B', '#4ECDC4', '#45B7D1', '#FFA07A', '#98D8C8',
  '#F7DC6F', '#BB8FCE', '#85C1E2', '#F8B739', '#52BE80',
  '#E74C3C', '#3498DB', '#9B59B6', '#1ABC9C', '#F39C12',
]

export function ColorPicker({ value, onChange }: ColorPickerProps) {
  const [showPicker, setShowPicker] = useState(false)

  return (
    <div className="color-picker">
      <button
        type="button"
        className="color-picker-trigger"
        onClick={() => setShowPicker(!showPicker)}
        style={{ backgroundColor: value }}
        aria-label="選擇顏色"
      />
      {showPicker && (
        <div className="color-picker-dropdown">
          <div className="color-picker-presets">
            {PRESET_COLORS.map((color) => (
              <button
                key={color}
                type="button"
                className="color-picker-swatch"
                style={{ backgroundColor: color }}
                onClick={() => {
                  onChange(color)
                  setShowPicker(false)
                }}
                aria-label={`選擇顏色 ${color}`}
              />
            ))}
          </div>
          <input
            type="color"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            className="color-picker-input"
          />
        </div>
      )}
    </div>
  )
}
