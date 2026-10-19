import { httpClient } from './httpClient'

export const authService = {
  // POST /auth/login -> { _id, name, email } del usuario único
  async login({ email, password }) {
    const { data } = await httpClient.post('/auth/login', { email, password })
    return data
  },
}
