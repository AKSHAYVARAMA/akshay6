import { useState } from "react";
import { LocateFixed } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { getCurrentCoordinates, type Coordinates } from "@/lib/geolocation";

export function LocationButton({
  mode,
  coordinates,
  onCoordinates,
}: {
  mode: "nearby" | "listing";
  coordinates: Coordinates | null;
  onCoordinates: (coordinates: Coordinates) => void;
}) {
  const [locating, setLocating] = useState(false);

  const requestLocation = async () => {
    setLocating(true);
    try {
      onCoordinates(await getCurrentCoordinates());
      if (mode === "nearby") toast.success("Nearby listings are now first.");
      else toast.success("Approximate location added to your listing.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Location could not be accessed.");
    } finally {
      setLocating(false);
    }
  };

  return (
    <div className="space-y-1.5">
      <Button
        type="button"
        variant={coordinates && mode === "nearby" ? "secondary" : "outline"}
        disabled={locating}
        onClick={() => void requestLocation()}
      >
        <LocateFixed className="mr-2 size-4" />
        {locating
          ? "Finding location…"
          : mode === "nearby"
            ? coordinates
              ? "Update nearby results"
              : "Show listings near me"
            : coordinates
              ? "Update approximate pin"
              : "Add approximate pin"}
      </Button>
      {mode === "listing" && (
        <p className="text-xs text-muted-foreground">
          Optional. Only an approximate area (about 100 m) is saved with your ad.
        </p>
      )}
    </div>
  );
}