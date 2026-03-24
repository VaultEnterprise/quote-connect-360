import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ChevronRight } from 'lucide-react';

const DEFAULT_TEMPLATES = [
  {
    id: 'medical_standard',
    name: 'Medical - Standard Introduction',
    category: 'Medical',
    content: 'Dear {{employer_name}},\n\nWe are pleased to present our medical insurance proposal effective {{effective_date}}...'
  },
  {
    id: 'dental_intro',
    name: 'Dental - Customizable',
    category: 'Dental',
    content: 'We recommend the following dental plan to complement your medical coverage...'
  },
  {
    id: 'vision_intro',
    name: 'Vision - Value Focus',
    category: 'Vision',
    content: 'Our vision plan offers comprehensive coverage with exceptional value...'
  },
  {
    id: 'voluntary_intro',
    name: 'Voluntary - Supplemental',
    category: 'Voluntary',
    content: 'We have included voluntary benefits to enhance your comprehensive benefits package...'
  },
];

export default function ProposalTemplateLibrary({ onSelect }) {
  const [selected, setSelected] = useState(null);
  const [preview, setPreview] = useState(null);

  const categories = [...new Set(DEFAULT_TEMPLATES.map(t => t.category))];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
      {/* Template List */}
      <div className="lg:col-span-2 space-y-3">
        {categories.map(category => (
          <div key={category}>
            <h3 className="text-sm font-semibold mb-2 text-muted-foreground">{category}</h3>
            <div className="space-y-2">
              {DEFAULT_TEMPLATES.filter(t => t.category === category).map(template => (
                <Card
                  key={template.id}
                  className={`p-4 cursor-pointer transition-all ${
                    selected?.id === template.id ? 'ring-2 ring-primary' : 'hover:border-primary'
                  }`}
                  onClick={() => {
                    setSelected(template);
                    setPreview(template);
                  }}
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-medium text-sm">{template.name}</p>
                      <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{template.content}</p>
                    </div>
                    <ChevronRight className="w-4 h-4 text-muted-foreground" />
                  </div>
                </Card>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Preview */}
      {preview && (
        <Card className="p-4 h-fit sticky top-4">
          <h3 className="font-semibold text-sm mb-3">Preview</h3>
          <div className="space-y-3">
            <div className="text-xs bg-muted p-3 rounded max-h-64 overflow-y-auto whitespace-pre-wrap">
              {preview.content}
            </div>
            <Button
              onClick={() => onSelect(preview)}
              className="w-full"
            >
              Use Template
            </Button>
          </div>
        </Card>
      )}
    </div>
  );
}