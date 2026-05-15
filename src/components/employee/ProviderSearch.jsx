import React, { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MapPin, Phone, Globe, Search } from "lucide-react";

const MOCK_PROVIDERS = [
  { id: 1, name: "Dr. Sarah Chen", specialty: "Primary Care", address: "123 Health St, San Francisco, CA 94105", phone: "(415) 555-1234", website: "sarahchen.md", network: ["Blue Shield PPO", "Aetna PPO"] },
  { id: 2, name: "Dr. James Wilson", specialty: "Cardiology", address: "456 Heart Ave, Oakland, CA 94607", phone: "(510) 555-5678", website: "wilsoncard.org", network: ["Blue Shield PPO", "Kaiser"] },
  { id: 3, name: "Bay Area Pediatrics", specialty: "Pediatrics", address: "789 Kids Lane, Berkeley, CA 94704", phone: "(510) 555-9012", website: "bayareapeds.org", network: ["All Plans"] },
  { id: 4, name: "San Francisco Dental", specialty: "Dentistry", address: "321 Smile Blvd, San Francisco, CA 94103", phone: "(415) 555-3456", website: "sfdental.com", network: ["All Dental Plans"] },
];

/**
 * ProviderSearch
 * In-network provider directory search for employees
 */
export default function ProviderSearch({ selectedPlan, plan }) {
  const [searchQuery, setSearchQuery] = useState("");
  const [filterSpecialty, setFilterSpecialty] = useState("all");

  const filteredProviders = useMemo(() => {
    return MOCK_PROVIDERS.filter(p => {
      const matchesQuery = searchQuery === "" || 
        p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.specialty.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.address.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchesSpecialty = filterSpecialty === "all" || p.specialty === filterSpecialty;
      const inNetwork = p.network.some(n => n.includes(plan?.plan_name || ""));
      
      return matchesQuery && matchesSpecialty && inNetwork;
    });
  }, [searchQuery, filterSpecialty, plan?.plan_name]);

  const specialties = Array.from(new Set(MOCK_PROVIDERS.map(p => p.specialty)));

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-2.5 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search by name, specialty, or location..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
      </div>

      {specialties.length > 0 && (
        <div className="flex gap-2 flex-wrap">
          <Badge
            variant={filterSpecialty === "all" ? "default" : "outline"}
            className="cursor-pointer"
            onClick={() => setFilterSpecialty("all")}
          >
            All
          </Badge>
          {specialties.map(s => (
            <Badge
              key={s}
              variant={filterSpecialty === s ? "default" : "outline"}
              className="cursor-pointer"
              onClick={() => setFilterSpecialty(s)}
            >
              {s}
            </Badge>
          ))}
        </div>
      )}

      <div className="space-y-2">
        {filteredProviders.length === 0 ? (
          <Card>
            <CardContent className="p-6 text-center text-muted-foreground text-sm">
              No providers found matching your search.
            </CardContent>
          </Card>
        ) : (
          filteredProviders.map(provider => (
            <Card key={provider.id} className="hover:shadow-sm transition-shadow">
              <CardContent className="p-4">
                <div className="space-y-2">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-sm">{provider.name}</h3>
                      <p className="text-xs text-muted-foreground">{provider.specialty}</p>
                    </div>
                    <Badge variant="outline" className="flex-shrink-0 text-[10px]">
                      In Network
                    </Badge>
                  </div>

                  <div className="space-y-1.5 text-xs">
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <MapPin className="w-3.5 h-3.5 flex-shrink-0" />
                      <span className="line-clamp-1">{provider.address}</span>
                    </div>
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Phone className="w-3.5 h-3.5 flex-shrink-0" />
                      <a href={`tel:${provider.phone}`} className="hover:text-primary">
                        {provider.phone}
                      </a>
                    </div>
                    {provider.website && (
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Globe className="w-3.5 h-3.5 flex-shrink-0" />
                        <a href={`https://${provider.website}`} target="_blank" rel="noopener noreferrer" className="hover:text-primary">
                          {provider.website}
                        </a>
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}