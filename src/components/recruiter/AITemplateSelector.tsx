import { useAITemplates, AITemplate } from '@/hooks/useAITemplates';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Loader2 } from 'lucide-react';

interface AITemplateSelectorProps {
  onSelect: (template: AITemplate | null) => void;
  disabled?: boolean;
}

export function AITemplateSelector({ onSelect, disabled }: AITemplateSelectorProps) {
  const { data: templates, isLoading } = useAITemplates();

  if (isLoading) {
    return (
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin" />
        Loading templates...
      </div>
    );
  }

  return (
    <Select
      disabled={disabled}
      onValueChange={(value) => {
        if (value === 'none') {
          onSelect(null);
        } else {
          const template = templates?.find((t) => t.id === value);
          if (template) onSelect(template);
        }
      }}
    >
      <SelectTrigger className="w-full md:w-[300px]">
        <SelectValue placeholder="Select a template..." />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="none">No template (custom)</SelectItem>
        {templates?.map((template) => (
          <SelectItem key={template.id} value={template.id}>
            {template.name}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
