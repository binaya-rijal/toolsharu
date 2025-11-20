import { IdCardData } from "./IdCardForm";
import ModernTemplate from "./templates/ModernTemplate";
import ClassicTemplate from "./templates/ClassicTemplate";
import MinimalTemplate from "./templates/MinimalTemplate";

interface IdCardPreviewProps {
    data: IdCardData;
}

export default function IdCardPreview({ data }: IdCardPreviewProps) {
    const variant = data.variant || 'modern';

    switch (variant) {
        case 'classic':
            return <ClassicTemplate data={data} />;
        case 'minimal':
            return <MinimalTemplate data={data} />;
        case 'modern':
        default:
            return <ModernTemplate data={data} />;
    }
}
