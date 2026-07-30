import { signOut } from "@/auth";
import { Button } from "@/components/ui/button";

export function CikisFormu() {
  return (
    <form
      action={async () => {
        "use server";
        await signOut({ redirectTo: "/yonetim/giris" });
      }}
    >
      <Button type="submit" varyant="hayalet" boyut="sm">
        Çıkış
      </Button>
    </form>
  );
}
