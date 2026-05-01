import { config } from './config.js'

export class CentralApiNotFoundError extends Error {}
export class CentralApiError extends Error {
  status: number

  constructor(message: string, status: number) {
    super(message)
    this.status = status
  }
}

export const getCentralUserSecurityScore = async (userId: number): Promise<number> => {
  const endpoint = `${config.CENTRAL_API_URL}/api/data/users/${userId}`
  const response = await fetch(endpoint, {
    headers: {
      Authorization: `Bearer ${config.CENTRAL_API_TOKEN}`,
    },
  })

  if (response.status === 404) {
    throw new CentralApiNotFoundError('User not found in Central API')
  }

  if (!response.ok) {
    throw new CentralApiError('Failed to fetch user from Central API', response.status)
  }

  const data = (await response.json()) as { securityScore?: number }

  if (typeof data.securityScore !== 'number') {
    throw new CentralApiError('Central API response missing securityScore', 502)
  }

  return data.securityScore
}

export const discountFromSecurityScore = (securityScore: number): number => {
  if (securityScore >= 80) return 20
  if (securityScore >= 60) return 15
  if (securityScore >= 40) return 10
  if (securityScore >= 20) return 5
  return 0
}
