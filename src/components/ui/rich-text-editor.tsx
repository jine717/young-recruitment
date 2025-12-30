import { useState } from 'react';
import {
  DefaultEditor,
  BtnBold,
  BtnItalic,
  BtnUnderline,
  BtnBulletList,
  BtnNumberedList,
  Toolbar,
  Separator,
} from 'react-simple-wysiwyg';
import { Edit3, Eye } from 'lucide-react';
import { cn } from '@/lib/utils';

interface RichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
}

export function RichTextEditor({ 
  value, 
  onChange, 
  placeholder, 
  disabled,
  className 
}: RichTextEditorProps) {
  const [mode, setMode] = useState<'edit' | 'preview'>('edit');

  return (
    <div className={cn(
      "rich-text-editor rounded-md border border-input bg-background overflow-hidden",
      disabled && "opacity-50 cursor-not-allowed",
      className
    )}>
      {/* Tabs */}
      <div className="flex border-b border-input bg-muted/30">
        <button
          type="button"
          onClick={() => setMode('edit')}
          className={cn(
            "flex items-center gap-1.5 px-4 py-2 text-sm font-medium transition-colors",
            mode === 'edit' 
              ? "border-b-2 border-primary text-primary bg-background" 
              : "text-muted-foreground hover:text-foreground"
          )}
        >
          <Edit3 className="h-4 w-4" />
          Edit
        </button>
        <button
          type="button"
          onClick={() => setMode('preview')}
          className={cn(
            "flex items-center gap-1.5 px-4 py-2 text-sm font-medium transition-colors",
            mode === 'preview' 
              ? "border-b-2 border-primary text-primary bg-background" 
              : "text-muted-foreground hover:text-foreground"
          )}
        >
          <Eye className="h-4 w-4" />
          Preview
        </button>
      </div>

      {/* Content */}
      {mode === 'edit' ? (
        <DefaultEditor
          value={value}
          onChange={(e) => onChange(e.target.value)}
          disabled={disabled}
          placeholder={placeholder}
        >
          <Toolbar>
            <BtnBold />
            <BtnItalic />
            <BtnUnderline />
            <Separator />
            <BtnBulletList />
            <BtnNumberedList />
          </Toolbar>
        </DefaultEditor>
      ) : (
        <div 
          className="min-h-[150px] p-4 prose prose-neutral dark:prose-invert max-w-none"
          dangerouslySetInnerHTML={{ 
            __html: value || '<p class="text-muted-foreground italic">No content to preview</p>' 
          }}
        />
      )}
    </div>
  );
}
