import { ProductionFileClient } from '@/features/production/components/ProductionFileClient';

interface PageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function ProductionFilePage({ params }: PageProps) {
  const { id } = await params;
  return <ProductionFileClient id={id} />;
}
