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
  return (
    <div className={cn(
      "rich-text-editor rounded-md border border-input bg-background",
      disabled && "opacity-50 cursor-not-allowed",
      className
    )}>
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
    </div>
  );
}
