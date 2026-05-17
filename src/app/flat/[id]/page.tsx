import ListingDetail from "@/components/ListingDetail";

export default async function FlatPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <ListingDetail id={id} type="flat" />;
}
