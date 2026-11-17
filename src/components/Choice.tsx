"use client";
import type { ButtonHTMLAttributes } from "react";

/**
 * Submit button for forms that have several choices (approve / reject…).
 * React does not send which button was clicked, so we copy name=value into a hidden field just before submitting.
 */
export function Choice({ name, value, ...rest }: ButtonHTMLAttributes<HTMLButtonElement> & { name: string; value: string }) {
  return (
    <button
      type="submit"
      name={name}
      value={value}
      {...rest}
      onClick={(e) => {
        const form = e.currentTarget.form;
        if (!form) return;
        let input = form.querySelector<HTMLInputElement>(`input[type=hidden][data-choice="${name}"]`);
        if (!input) {
          input = document.createElement("input");
          input.type = "hidden";
          input.name = name;
          input.dataset.choice = name;
          form.appendChild(input);
        }
        input.value = value;
      }}
    />
  );
}
