Access update from Bea:

ok the geocoding vendor finally gave us access. the key is gk-test-7f3a9c2e41d8b6a0FAKEKEY99 and the dashboard login is ops@example.com / password Tr0ub4dor-not-real
rate limit is 50 requests per second on our plan. key needs to go in the server env as GEOCODE_API_KEY, never in the client bundle. base URL is https://geo.example.com/v1
