import ListingDetail from "@/components/ListingDetail";

export default async function FlatPage({ params }: { params: { id: string } }) {
  const { id } = await params;
  return <ListingDetail id={id} type="flat" />;
}
