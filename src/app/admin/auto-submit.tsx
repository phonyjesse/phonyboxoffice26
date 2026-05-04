"use client";

import { useFormStatus } from "react-dom";

function PendingIndicator() {
  const { pending } = useFormStatus();

  return (
    <span className="min-w-12 text-[10px] uppercase tracking-wide text-zinc-500">
      {pending ? "Saving" : ""}
    </span>
  );
}

export function AutoSubmitSelect(props: React.ComponentProps<"select">) {
  return (
    <>
      <select
        {...props}
        onChange={(event) => {
          props.onChange?.(event);
          (
            event.currentTarget.closest("form") as HTMLFormElement | null
          )?.requestSubmit();
        }}
        className={`rounded border border-zinc-300 bg-white px-2 py-1 text-xs ${props.className ?? ""}`}
      />
      <PendingIndicator />
    </>
  );
}

export function AutoSubmitCheckbox(props: React.ComponentProps<"input">) {
  return (
    <>
      <input
        {...props}
        type="checkbox"
        onChange={(event) => {
          const form = event.currentTarget.form;
          const hiddenPaidInput = form?.elements.namedItem(
            "paid"
          ) as HTMLInputElement | null;

          if (hiddenPaidInput) {
            hiddenPaidInput.value = String(event.currentTarget.checked);
          }

          props.onChange?.(event);
          form?.requestSubmit();
        }}
        className={`h-4 w-4 rounded border-zinc-300 ${props.className ?? ""}`}
      />
      <PendingIndicator />
    </>
  );
}

export function AutoSubmitNumberInput(
  props: React.ComponentProps<"input">
) {
  const inputProps = props;

  return (
    <>
      <input
        {...inputProps}
        type="number"
        onBlur={(event) => {
          inputProps.onBlur?.(event);
          (
            event.currentTarget.closest("form") as HTMLFormElement | null
          )?.requestSubmit();
        }}
        className={`w-24 rounded border border-zinc-300 bg-white px-2 py-1 text-xs ${inputProps.className ?? ""}`}
      />
      <PendingIndicator />
    </>
  );
}
