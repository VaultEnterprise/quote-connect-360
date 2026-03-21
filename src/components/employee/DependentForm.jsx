import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { X, Plus } from "lucide-react";

/**
 * DependentForm
 * Proper inline form replacing prompt() for adding dependents.
 *
 * Props:
 *   dependents    — Dependent[]
 *   onAdd         — (dependent) => void
 *   onRemove      — (index) => void
 *   canAddMore    — boolean
 *   disabled      — boolean
 */
export default function DependentForm({ dependents, onAdd, onRemove, canAddMore, disabled }) {
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ firstName: "", lastName: "", relationship: "", dob: "" });
  const [errors, setErrors] = useState({});

  const validate = () => {
    const err = {};
    if (!form.firstName.trim()) err.firstName = "First name required";
    if (!form.lastName.trim()) err.lastName = "Last name required";
    if (!form.relationship) err.relationship = "Relationship required";
    if (!form.dob) err.dob = "Date of birth required";
    else {
      const dob = new Date(form.dob);
      if (dob > new Date()) err.dob = "Date of birth must be in the past";
      const age = new Date().getFullYear() - dob.getFullYear();
      if (form.relationship === "child" && age > 26) {
        err.dob = "Children must be under 26 years old";
      }
    }
    setErrors(err);
    return Object.keys(err).length === 0;
  };

  const handleSubmit = () => {
    if (!validate()) return;
    onAdd({
      name: `${form.firstName} ${form.lastName}`,
      firstName: form.firstName,
      lastName: form.lastName,
      relationship: form.relationship,
      date_of_birth: form.dob,
    });
    setForm({ firstName: "", lastName: "", relationship: "", dob: "" });
    setShowForm(false);
  };

  return (
    <div className="space-y-3">
      {/* Added dependents list */}
      {dependents.map((dep, i) => (
        <Card key={i}>
          <CardContent className="p-3 flex items-center justify-between gap-2">
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium">{dep.name || `${dep.firstName} ${dep.lastName}`}</p>
              <p className="text-xs text-muted-foreground capitalize">
                {dep.relationship?.replace(/_/g, " ")}
                {dep.date_of_birth && ` • DOB: ${new Date(dep.date_of_birth).toLocaleDateString()}`}
              </p>
            </div>
            <Button
              variant="ghost"
              size="sm"
              className="h-7 w-7 p-0 text-destructive hover:bg-destructive/10"
              onClick={() => onRemove(i)}
              disabled={disabled}
            >
              <X className="w-4 h-4" />
            </Button>
          </CardContent>
        </Card>
      ))}

      {/* Add dependent form */}
      {canAddMore && !showForm && (
        <Button
          variant="outline"
          className="w-full gap-2"
          onClick={() => setShowForm(true)}
          disabled={disabled}
        >
          <Plus className="w-4 h-4" /> Add Another Dependent
        </Button>
      )}

      {showForm && (
        <Card className="border-primary/30 bg-primary/5">
          <CardContent className="p-4 space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label htmlFor="firstName" className="text-xs">First Name</Label>
                <Input
                  id="firstName"
                  value={form.firstName}
                  onChange={e => setForm(f => ({ ...f, firstName: e.target.value }))}
                  placeholder="John"
                  className={errors.firstName ? "border-destructive" : ""}
                />
                {errors.firstName && <p className="text-[10px] text-destructive mt-1">{errors.firstName}</p>}
              </div>
              <div>
                <Label htmlFor="lastName" className="text-xs">Last Name</Label>
                <Input
                  id="lastName"
                  value={form.lastName}
                  onChange={e => setForm(f => ({ ...f, lastName: e.target.value }))}
                  placeholder="Doe"
                  className={errors.lastName ? "border-destructive" : ""}
                />
                {errors.lastName && <p className="text-[10px] text-destructive mt-1">{errors.lastName}</p>}
              </div>
            </div>

            <div>
              <Label htmlFor="relationship" className="text-xs">Relationship</Label>
              <Select value={form.relationship} onValueChange={v => setForm(f => ({ ...f, relationship: v }))}>
                <SelectTrigger id="relationship" className={errors.relationship ? "border-destructive" : ""}>
                  <SelectValue placeholder="Select relationship" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="spouse">Spouse</SelectItem>
                  <SelectItem value="domestic_partner">Domestic Partner</SelectItem>
                  <SelectItem value="child">Child</SelectItem>
                  <SelectItem value="stepchild">Stepchild</SelectItem>
                </SelectContent>
              </Select>
              {errors.relationship && <p className="text-[10px] text-destructive mt-1">{errors.relationship}</p>}
            </div>

            <div>
              <Label htmlFor="dob" className="text-xs">Date of Birth</Label>
              <Input
                id="dob"
                type="date"
                value={form.dob}
                onChange={e => setForm(f => ({ ...f, dob: e.target.value }))}
                className={errors.dob ? "border-destructive" : ""}
              />
              {errors.dob && <p className="text-[10px] text-destructive mt-1">{errors.dob}</p>}
            </div>

            <div className="flex gap-2 pt-1">
              <Button variant="outline" size="sm" className="flex-1" onClick={() => setShowForm(false)}>
                Cancel
              </Button>
              <Button size="sm" className="flex-1" onClick={handleSubmit}>
                Add
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}