"use client";

import { Select as AnimalSelect } from "animal-island-ui";
import type { SelectOption, SelectProps as AnimalSelectProps } from "animal-island-ui";

export type AppSelectOption = SelectOption;
export type AppSelectProps = AnimalSelectProps;

export function AppSelect(props: AppSelectProps) {
  return <AnimalSelect {...props} />;
}
