interface HiddenFormFieldsProps {
  fields: Record<string, string>;
}

export function HiddenFormFields({ fields }: HiddenFormFieldsProps) {
  return (
    <>
      {Object.entries(fields).map(([name, value]) => (
        <input key={name} type="hidden" name={name} value={value} />
      ))}
    </>
  );
}
