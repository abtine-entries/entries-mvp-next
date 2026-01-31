import type { ComponentType, SVGProps } from 'react'
import {
  SiQuickbooks,
  SiXero,
  SiStripe,
  SiChase,
  SiBankofamerica,
  SiWellsfargo,
  SiBrex,
  SiGusto,
  SiAdp,
  SiSquare,
  SiShopify,
  SiHubspot,
  SiSalesforce,
  SiSlack,
  SiWhatsapp,
  SiGmail,
  SiGoogledrive,
  SiWise,
} from '@icons-pack/react-simple-icons'

export type ConnectorType =
  | 'quickbooks'
  | 'xero'
  | 'stripe'
  | 'chase'
  | 'bankofamerica'
  | 'wells_fargo'
  | 'mercury'
  | 'brex'
  | 'ramp'
  | 'gusto'
  | 'adp'
  | 'square'
  | 'shopify'
  | 'bill'
  | 'hubspot'
  | 'salesforce'
  | 'slack'
  | 'whatsapp'
  | 'gmail'
  | 'google_drive'
  | 'wise'

export interface ConnectorConfig {
  icon?: ComponentType<SVGProps<SVGSVGElement> & { size?: number; color?: string }>
  domain: string
  initials: string
  color: string
  staticLogo?: string
}

export const connectorConfig: Record<ConnectorType, ConnectorConfig> = {
  quickbooks: {
    icon: SiQuickbooks,
    domain: 'quickbooks.intuit.com',
    initials: 'QB',
    color: '#2CA01C',
    staticLogo: '/qbo-icon.png',
  },
  xero: {
    icon: SiXero,
    domain: 'xero.com',
    initials: 'XO',
    color: '#13B5EA',
  },
  stripe: {
    icon: SiStripe,
    domain: 'stripe.com',
    initials: 'ST',
    color: '#635BFF',
  },
  chase: {
    icon: SiChase,
    domain: 'chase.com',
    initials: 'CH',
    color: '#117ACA',
  },
  bankofamerica: {
    icon: SiBankofamerica,
    domain: 'bankofamerica.com',
    initials: 'BA',
    color: '#012169',
  },
  wells_fargo: {
    icon: SiWellsfargo,
    domain: 'wellsfargo.com',
    initials: 'WF',
    color: '#D71E28',
  },
  mercury: {
    domain: 'mercury.com',
    initials: 'ME',
    color: '#5856D6',
  },
  brex: {
    icon: SiBrex,
    domain: 'brex.com',
    initials: 'BX',
    color: '#FF5733',
  },
  ramp: {
    domain: 'ramp.com',
    initials: 'RP',
    color: '#F2C94C',
  },
  gusto: {
    icon: SiGusto,
    domain: 'gusto.com',
    initials: 'GU',
    color: '#F45D48',
  },
  adp: {
    icon: SiAdp,
    domain: 'adp.com',
    initials: 'AP',
    color: '#D0271D',
  },
  square: {
    icon: SiSquare,
    domain: 'squareup.com',
    initials: 'SQ',
    color: '#006AFF',
  },
  shopify: {
    icon: SiShopify,
    domain: 'shopify.com',
    initials: 'SH',
    color: '#96BF48',
  },
  bill: {
    domain: 'bill.com',
    initials: 'BL',
    color: '#00C4B3',
  },
  hubspot: {
    icon: SiHubspot,
    domain: 'hubspot.com',
    initials: 'HS',
    color: '#FF7A59',
  },
  salesforce: {
    icon: SiSalesforce,
    domain: 'salesforce.com',
    initials: 'SF',
    color: '#00A1E0',
  },
  slack: {
    icon: SiSlack,
    domain: 'slack.com',
    initials: 'SL',
    color: '#4A154B',
  },
  whatsapp: {
    icon: SiWhatsapp,
    domain: 'whatsapp.com',
    initials: 'WA',
    color: '#25D366',
  },
  gmail: {
    icon: SiGmail,
    domain: 'gmail.com',
    initials: 'GM',
    color: '#EA4335',
  },
  google_drive: {
    icon: SiGoogledrive,
    domain: 'drive.google.com',
    initials: 'GD',
    color: '#4285F4',
  },
  wise: {
    icon: SiWise,
    domain: 'wise.com',
    initials: 'WI',
    color: '#9FE870',
  },
}

export function hasConnectorLogo(connector: string): connector is ConnectorType {
  return connector in connectorConfig
}
