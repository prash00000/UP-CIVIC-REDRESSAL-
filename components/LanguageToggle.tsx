"use client";

import React from "react";
import { Button } from "@astryxdesign/core/Button";
import { ButtonGroup } from "@astryxdesign/core/ButtonGroup";
import { useLang } from "@/lib/i18n";

export default function LanguageToggle() {
  const { lang, setLang } = useLang();

  return (
    <div role="group" aria-label="Language selection">
      <ButtonGroup size="sm" label="Language selection">
        <Button
          type="button"
          label="English"
          variant={lang === "en" ? "primary" : "secondary"}
          aria-pressed={lang === "en"}
          onClick={() => setLang("en")}
        />
        <Button
          type="button"
          label="हिन्दी"
          variant={lang === "hi" ? "primary" : "secondary"}
          aria-pressed={lang === "hi"}
          onClick={() => setLang("hi")}
        />
      </ButtonGroup>
    </div>
  );
}
