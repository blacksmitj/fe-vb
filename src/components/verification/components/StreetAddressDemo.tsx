"use client";

import * as React from "react";
import { StreetAddressInput } from "@/components/ui/street-address-input";
import { ParsedAddress } from "@/lib/utils/street-verifier";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Sparkles, MapPin, CheckCircle2, ArrowRight } from "lucide-react";

export function StreetAddressDemo() {
  // Demo 1: Standalone Controlled Input
  const [address1, setAddress1] = React.useState("jl. kompas blok. c3 no. 12 rt 4 rw 10");
  const [parsed1, setParsed1] = React.useState<ParsedAddress | null>(null);

  // Demo 2: Form with Separate RT & RW Fields
  const [formAddress, setFormAddress] = React.useState("jalan persada komp. permai no, 8, rt 5 rw 12");
  const [formRt, setFormRt] = React.useState("000");
  const [formRw, setFormRw] = React.useState("000");
  const [mainStreet, setMainStreet] = React.useState("");

  const handleFormParsed = (parsed: ParsedAddress) => {
    setMainStreet(parsed.mainAddr);
    setFormRt(parsed.rt);
    setFormRw(parsed.rw);
  };

  const sampleInputs = [
    { label: "Tanpa RT/RW (Error)", text: "jalan merdeka no 105" },
    { label: "Belum Diformat (Error)", text: "jl. kompas blok. c3 no, 12, rt 4 rw 10" },
    { label: "Romawi & RT/RW", text: "gg. xv no 3 rt 12 rw 4" },
    { label: "Kompleks", text: "jln. sisingamangaraja komp. griya indah b. 2 rt 8 rw 15" },
  ];

  return (
    <div className="w-full max-w-4xl mx-auto space-y-6 p-4 md:p-6">
      {/* Header Banner */}
      <div className="rounded-xl border bg-gradient-to-r from-amber-500/10 via-amber-500/5 to-transparent p-6 space-y-2">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-lg bg-amber-500/20 text-amber-600 dark:text-amber-400">
            <Sparkles className="size-6" />
          </div>
          <div>
            <h2 className="text-xl font-bold tracking-tight">Modul Verifikasi & Format Alamat Jalan</h2>
            <p className="text-sm text-muted-foreground">
              Komponen input cerdas dengan Magic Wand toggle untuk menata nama jalan, angka Romawi, singkatan, serta ekstraksi RT/RW.
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Card 1: Standalone Demo */}
        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <MapPin className="size-4 text-amber-500" />
              1. Modul Input Standalone
            </CardTitle>
            <CardDescription className="text-xs">
              Uji coba Magic Wand pada single field input. Klik tombol <b>Format</b> untuk mempercantik alamat & klik <b>Batal</b> untuk kembali.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label className="text-xs font-semibold">Alamat Lengkap</Label>
              <StreetAddressInput
                value={address1}
                onChange={setAddress1}
                onParsedChange={setParsed1}
              />
            </div>

            {/* Live Parsed Status */}
            {parsed1 && (
              <div className="rounded-lg border bg-muted/30 p-3 space-y-1.5 text-xs">
                <div className="font-medium text-muted-foreground text-[11px] uppercase tracking-wider">
                  Hasil Parse Real-time:
                </div>
                <div className="grid grid-cols-3 gap-2 pt-1 font-mono">
                  <div className="bg-background p-2 rounded border">
                    <span className="text-muted-foreground text-[10px] block font-sans">Jalan Utama:</span>
                    <span className="font-semibold text-foreground">{parsed1.mainAddr || "-"}</span>
                  </div>
                  <div className="bg-background p-2 rounded border">
                    <span className="text-muted-foreground text-[10px] block font-sans">RT:</span>
                    <span className="font-semibold text-amber-600 dark:text-amber-400">{parsed1.rt}</span>
                  </div>
                  <div className="bg-background p-2 rounded border">
                    <span className="text-muted-foreground text-[10px] block font-sans">RW:</span>
                    <span className="font-semibold text-amber-600 dark:text-amber-400">{parsed1.rw}</span>
                  </div>
                </div>
              </div>
            )}

            {/* Quick Sample Selector */}
            <div className="space-y-1.5 pt-2">
              <span className="text-[11px] font-medium text-muted-foreground">Pilih Contoh Teks Mentah:</span>
              <div className="flex flex-wrap gap-1.5">
                {sampleInputs.map((sample, idx) => (
                  <Button
                    key={idx}
                    type="button"
                    variant="outline"
                    size="sm"
                    className="text-[11px] h-6 font-mono px-2 py-0"
                    onClick={() => setAddress1(sample.text)}
                  >
                    {sample.label}
                  </Button>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Card 2: Integrated Form Demo */}
        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <CheckCircle2 className="size-4 text-emerald-500" />
              2. Integrasi Form Auto-Fill RT/RW
            </CardTitle>
            <CardDescription className="text-xs">
              Menggunakan callback <code className="bg-muted px-1 py-0.5 rounded text-[10px]">onParsedChange</code> untuk mengisi field RT dan RW secara terpisah.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label className="text-xs font-semibold">Input Alamat Mentah / Ketik Alamat</Label>
              <StreetAddressInput
                value={formAddress}
                onChange={setFormAddress}
                onParsedChange={handleFormParsed}
              />
            </div>

            <div className="border-t pt-3 space-y-3">
              <div className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground">
                <ArrowRight className="size-3.5 text-amber-500" />
                Field Form Terpisah (Auto-Populated):
              </div>

              <div className="space-y-2">
                <Label className="text-xs">Nama Jalan Utama</Label>
                <Input value={mainStreet} readOnly className="bg-muted/50 font-medium" />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-xs">RT</Label>
                  <Input value={formRt} readOnly className="bg-muted/50 font-mono text-center font-bold text-amber-600 dark:text-amber-400" />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">RW</Label>
                  <Input value={formRw} readOnly className="bg-muted/50 font-mono text-center font-bold text-amber-600 dark:text-amber-400" />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
