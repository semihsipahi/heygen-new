export class DifyFlows {
  /**
   * @param {string} baseUrl – API endpoint'lerinin ortak base URL'i
   */

  constructor(baseUrl = '/api/dify/') {
    this.baseUrl = baseUrl;
  }

  async callFlow(flowID, params) {
    try {
      const response = await fetch(`${this.baseUrl}${flowID}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(params),
      });
      if (!response.ok) {
        throw new Error(`Sunucu hatası: ${response.status}`);
      }
      return await response.json();
    } catch (error) {
      console.error('Dify flow çağrısı sırasında hata oluştu:', error);
      return null;
    }
  }

  async candidatePreparation(payload) {
    return this.callFlow('candidate_preparation', payload);
  }

  async answerSummary(params) {
    return this.callFlow('answer_summary', params);
  }
}
