import ListingDetail from "@/components/ListingDetail";

export default async function FlatmatePage({ params }: { params: { id: string } }) {
  const { id } = await params;
  return <ListingDetail id={id} type="flatmate" />;
}
