import { useCallback, useMemo, useState } from "react";
import { z } from "zod";

export interface FieldErrors {
  [field: string]: string | undefined;
}

export function useFormValidation<T extends z.ZodObject>(schema: T) {
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [touchedFields, setTouchedFields] = useState<Set<string>>(new Set());

  const touchField = useCallback((field: string) => {
    setTouchedFields((prev) => {
      const next = new Set(prev);
      next.add(field);
      return next;
    });
  }, []);

  const validate = useCallback(
    (data: unknown): data is z.infer<T> => {
      const result = z.safeParse(schema, data);
      if (result.success) {
        setFieldErrors({});
        return true;
      }
      const errors: FieldErrors = {};
      for (const issue of result.error.issues) {
        const field = issue.path.map(String).join(".");
        if (!errors[field]) {
          errors[field] = issue.message;
        }
      }
      setFieldErrors(errors);
      return false;
    },
    [schema],
  );

  const validateField = useCallback(
    (field: string, value: unknown) => {
      const fieldSchema = schema.shape[field];
      if (!fieldSchema) return;

      const result = z.safeParse(fieldSchema, value);
      setFieldErrors((prev) => ({
        ...prev,
        [field]: result.success ? undefined : result.error.issues[0]?.message,
      }));
    },
    [schema],
  );

  const getFieldError = useCallback(
    (field: string): string | undefined => {
      if (!touchedFields.has(field)) return undefined;
      return fieldErrors[field];
    },
    [fieldErrors, touchedFields],
  );

  const isValid = useMemo(
    () => Object.values(fieldErrors).every((e) => !e),
    [fieldErrors],
  );

  const clearErrors = useCallback(() => {
    setFieldErrors({});
    setTouchedFields(new Set());
  }, []);

  return {
    fieldErrors,
    touchField,
    validate,
    validateField,
    getFieldError,
    isValid,
    clearErrors,
  };
}
