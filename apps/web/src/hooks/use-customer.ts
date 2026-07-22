"use client";

import * as React from "react";

import type { CustomerDashboard } from "@repo/domain";

import { customerDashboardAction } from "../actions/catalog";

/** Client customer/session snapshot via the BFF. `null` customer = signed out. */
export function useCustomer() {
  const [customer, setCustomer] = React.useState<CustomerDashboard | null>(null);
  const [loading, setLoading] = React.useState(false);
  const [loaded, setLoaded] = React.useState(false);

  const refresh = React.useCallback(async () => {
    setLoading(true);
    try {
      setCustomer(await customerDashboardAction());
    } finally {
      setLoading(false);
      setLoaded(true);
    }
  }, []);

  return { customer, isSignedIn: customer !== null, loading, loaded, refresh };
}
