import React from "react";
import { Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default function RoutedPagesDirectory({ pages }) {
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base">Platform Navigation Directory</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex flex-wrap gap-2">
          {pages.map((page) => (
            <Link key={page.href} to={page.href}>
              <Badge variant="outline" className="px-3 py-1.5 text-xs hover:bg-muted/50 transition-colors cursor-pointer">
                {page.label}
              </Badge>
            </Link>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}