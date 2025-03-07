import axios from 'axios';
import Cookies from 'js-cookie';

class ApiService {
  // constructor(namespace) {
  //   const baseURLs = {
  //     Common: process.env.NEXT_PUBLIC_API_COMMON,
  //     Meet: process.env.NEXT_PUBLIC_API_MEET,
  //     Report: process.env.NEXT_PUBLIC_API_REPORT,
  //     User: process.env.NEXT_PUBLIC_API_USER,
  //   };

  //   if (!baseURLs[namespace]) {
  //     throw new Error(`Invalid API namespace: ${namespace}`);
  //   }

  //   this.api = axios.create({
  //     baseURL: baseURLs[namespace],
  //     headers: {
  //       'Content-Type': 'application/json',
  //     },
  //   });

  //   this.baseURLs = baseURLs;
  //   this.namespace = namespace;

  //   this.initializeHeaders();
  // }

  // initializeHeaders() {
  //   const authToken = Cookies.get('authToken');
  //   const languageId =
  //     Cookies.get('languageId') || '0D91F4E4-161F-431D-B010-9FCC098381E3';

  //   if (authToken) {
  //     this.setAuthToken(authToken);
  //   }
  //   this.setLanguageId(languageId);
  // }

  setAuthToken(token) {
    this.api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
  }

  removeAuthToken() {
    delete this.api.defaults.headers.common['Authorization'];
  }

  setLanguageId(languageId) {
    this.api.defaults.headers.common['languageId'] = languageId;
  }

  async request(method, endpoint, { data = {}, params = {} } = {}) {
    try {
      const response = await this.api({
        method,
        url: this.baseURLs[this.namespace] + endpoint,
        data,
        params,
      });
      return response.data;
    } catch (error) {
      this.handleError(error);
    }
  }

  get(endpoint, params = {}) {
    return this.request('get', endpoint, { params });
  }

  post(endpoint, data) {
    return this.request('post', endpoint, { data });
  }

  put(endpoint, data) {
    return this.request('put', endpoint, { data });
  }

  delete(endpoint) {
    return this.request('delete', endpoint);
  }

  handleError(error) {
    console.error(
      'API Error:',
      error.response?.status,
      error.response?.data || error.message
    );
    throw error;
  }
}

export default ApiService;
