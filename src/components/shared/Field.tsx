// עוטף שדה טופס עם תווית shadcn Label, רמז אופציונלי וחיוב
import { Label } from "@/components/ui/label";

interface FieldProps {
  label: string;
  hint?: string;
  required?: boolean;
  children: React.ReactNode;
}

export default function Field({ label, hint, required, children }: FieldProps) {
  return (
    <div className="flex flex-col gap-1">
      <Label className="text-xs font-medium text-muted-foreground">
        {label}
        {required && <span className="text-destructive mr-0.5">*</span>}
      </Label>
      {children}
      {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
    </div>
  );
}
