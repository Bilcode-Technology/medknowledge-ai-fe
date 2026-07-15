"use client";

import { useEffect, useRef, useState } from "react";
import { Search, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { apiFetch } from "@/lib/api";
import type { KfaCodeItem } from "@/lib/types";

// M50/M22 — autocomplete kode KFA resmi (GET /kfa-codes/search). Dataset KFA
// di-import via `php artisan kfa:import`; bila tabel masih kosong, komponen
// tetap membiarkan free-text (nama zat tanpa kode) sebagai fallback — kode bisa
// di-assign belakangan oleh Terminologist.
type Props = {
  label?: string;
  name: string;
  kfaCode: string | null;
  onChange: (name: string, kfaCode: string | null) => void;
  placeholder?: string;
};

export function KfaIngredientPicker({ label, name, kfaCode, onChange, placeholder }: Props) {
  const [query, setQuery] = useState(name);
  const [results, setResults] = useState<KfaCodeItem[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [searched, setSearched] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- sinkronkan input saat parent mengganti nilai (mis. pre-fill dari hasil distilasi)
    setQuery(name);
  }, [name]);

  function handleInput(value: string) {
    setQuery(value);
    onChange(value, null); // ketik manual = kode lama tidak lagi berlaku

    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (value.trim().length < 2) {
      setResults([]);
      setIsOpen(false);
      return;
    }

    debounceRef.current = setTimeout(async () => {
      try {
        const items = await apiFetch<KfaCodeItem[]>(`/kfa-codes/search?q=${encodeURIComponent(value.trim())}`);
        setResults(items);
        setSearched(true);
        setIsOpen(true);
      } catch {
        setResults([]);
        setIsOpen(false);
      }
    }, 300);
  }

  function pick(item: KfaCodeItem) {
    setQuery(item.display);
    onChange(item.display, item.code);
    setIsOpen(false);
  }

  return (
    <div className="relative space-y-1.5">
      {label && <span className="text-xs font-medium">{label}</span>}
      <div className="relative">
        <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={query}
          onChange={(e) => handleInput(e.target.value)}
          onBlur={() => setTimeout(() => setIsOpen(false), 150)}
          placeholder={placeholder ?? "Cari zat aktif (KFA)..."}
          className="pl-8"
        />
      </div>
      {kfaCode ? (
        <Badge className="bg-success/10 text-success border-success/20 text-[10px] gap-1">
          KFA: {kfaCode}
          <button type="button" onClick={() => onChange(query, null)} className="hover:text-destructive">
            <X className="h-3 w-3" />
          </button>
        </Badge>
      ) : (
        <span className="text-[10px] text-muted-foreground">
          Tanpa kode KFA (free-text){searched && results.length === 0 ? " — dataset KFA kosong? jalankan `php artisan kfa:import`" : ""}
        </span>
      )}
      {isOpen && results.length > 0 && (
        <div className="absolute z-20 mt-1 max-h-56 w-full overflow-y-auto rounded-md border border-border bg-popover shadow-md">
          {results.map((item) => (
            <button
              key={item.id}
              type="button"
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => pick(item)}
              className="block w-full px-3 py-2 text-left text-xs hover:bg-accent"
            >
              <span className="font-mono text-[10px] text-primary">{item.code}</span>
              <span className="ml-2">{item.display}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
