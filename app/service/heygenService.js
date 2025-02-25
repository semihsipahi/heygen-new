export const fetchToken = async () => {
  const response = await fetch('/api/get-access-token', {
    method: 'POST',
  });
  return await response.text();
};
