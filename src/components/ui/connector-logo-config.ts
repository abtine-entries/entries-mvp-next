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

export interface ConnectorConfig {
  domain: string
  initials: string
  color: string
  staticLogo?: string
}

export const connectorConfig: Record<ConnectorType, ConnectorConfig> = {
  quickbooks: {
    domain: 'quickbooks.intuit.com',
    initials: 'QB',
    color: '#2CA01C',
    staticLogo: '/qbo-icon.png',
  },
  xero: {
    domain: 'xero.com',
    initials: 'XO',
    color: '#13B5EA',
  },
  stripe: {
    domain: 'stripe.com',
    initials: 'ST',
    color: '#635BFF',
  },
  chase: {
    domain: 'chase.com',
    initials: 'CH',
    color: '#117ACA',
  },
  bankofamerica: {
    domain: 'bankofamerica.com',
    initials: 'BA',
    color: '#012169',
  },
  wells_fargo: {
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
    domain: 'gusto.com',
    initials: 'GU',
    color: '#F45D48',
  },
  adp: {
    domain: 'adp.com',
    initials: 'AP',
    color: '#D0271D',
  },
  square: {
    domain: 'squareup.com',
    initials: 'SQ',
    color: '#006AFF',
  },
  shopify: {
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
    domain: 'hubspot.com',
    initials: 'HS',
    color: '#FF7A59',
  },
  salesforce: {
    domain: 'salesforce.com',
    initials: 'SF',
    color: '#00A1E0',
  },
}

export function hasConnectorLogo(connector: string): connector is ConnectorType {
  return connector in connectorConfig
}
