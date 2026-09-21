# Sales Management — Spring Cloud microservices

A sales management backend split into four Spring Boot services behind a Spring Cloud Gateway,
with Consul for service discovery and JWT authentication.

```
                           ┌──────────────┐
      client ──────────────│ api-gateway  │  :8989
                           └──────┬───────┘
                                  │ routes resolved via Consul (lb://)
        ┌─────────────────┬───────┴────────┬──────────────────┐
        │                 │                │                  │
┌───────────────┐ ┌──────────────┐ ┌──────────────┐ ┌──────────────────┐
│ MicroService1 │ │MicroService2 │ │MicroService3 │ │ MicroServiceAuth │
│   produits    │ │   clients    │ │   ventes     │ │  register/login  │
│     :8999     │ │    :8998     │ │    :8997     │ │      :8996       │
└───────┬───────┘ └──────┬───────┘ └──────┬───────┘ └────────┬─────────┘
        └────────────────┴────────────────┴──────────────────┘
                            MySQL  ·  Consul :8500
```

| Service | Port | Responsibility |
| --- | --- | --- |
| `api-gateway` | 8989 | Single entry point, routing, CORS |
| `MicroService1` | 8999 | Products (`produits`) |
| `MicroService2` | 8998 | Customers (`clients`) |
| `MicroService3` | 8997 | Sales (`ventes`), and calls 1 and 2 |
| `MicroServiceAuth` | 8996 | Registration, login, JWT issuing |

## Stack

Java 17 · Spring Boot 3.3.5 · Spring Cloud 2023.0.3 (Gateway, Consul discovery, LoadBalancer) ·
Spring Data JPA · Spring Security + jjwt · MySQL 8 (H2 for tests) · Maven

## Running it

### 1. Infrastructure

```bash
docker compose up -d
```

Consul on <http://localhost:8500> (UI included) and MySQL on `localhost:3306` with the
`springbootDB` schema — the defaults every service falls back to.

### 2. The services

Start the auth service first, then the three domain services, then the gateway:

```bash
cd salesback/MicroServiceAuth && ./mvnw spring-boot:run
cd salesback/MicroService1    && ./mvnw spring-boot:run
cd salesback/MicroService2    && ./mvnw spring-boot:run
cd salesback/MicroService3    && ./mvnw spring-boot:run
cd salesback/api-gateway      && ./mvnw spring-boot:run
```

Each one registers itself in Consul under its `spring.application.name`, so the gateway's
`lb://` routes resolve without any hardcoded ports. Check the Consul UI to confirm all five
are registered before calling through the gateway.

### Building everything at once

`salesback/pom.xml` is an aggregator, so from the repository root:

```bash
cd salesback
mvn clean package          # builds all five
mvn -pl MicroService1 test # or just one
```

Each service also keeps its own Maven wrapper and can be built on its own.

## Authentication

```bash
# register
curl -X POST http://localhost:8989/api/auth/register \
  -H 'Content-Type: application/json' \
  -d '{"username":"amine","password":"secret"}'

# login → returns {"jwt":"...", "message":"Login successful"}
curl -X POST http://localhost:8989/api/auth/login \
  -H 'Content-Type: application/json' \
  -d '{"username":"amine","password":"secret"}'

# use it
curl http://localhost:8989/api/auth/me -H 'Authorization: Bearer <jwt>'
```

Passwords are stored BCrypt-hashed. Tokens are HS256, signed with `jwt.secret` and valid for
`jwt.expiration-ms` (10 hours by default).

**The token is only enforced inside `MicroServiceAuth`.** MicroService1, 2 and 3 have no security
configured, so they accept any caller. See *Known gaps* below.

## API

Everything is reachable through the gateway on `:8989`.

### Products — `MicroService1`

| Method | Path | Notes |
| --- | --- | --- |
| `GET` | `/api/produits` | List |
| `GET` | `/api/produits/{id}` | 404 when absent |
| `POST` | `/api/produits/add` | 201 with the saved product |
| `PUT` | `/api/produits/{id}` | The path id wins over the body |
| `DELETE` | `/api/produits/{id}` | 204, or 404 when absent |
| `DELETE` | `/api/produits/vider` | Empties the table |

### Customers — `MicroService2`

| Method | Path | Notes |
| --- | --- | --- |
| `GET` | `/api/clients` | List |
| `GET` | `/api/clients/{id}` | 404 when absent |
| `POST` | `/api/clients/add` | 201 with the saved customer |
| `PUT` | `/api/clients/{id}` | 404 when absent |
| `DELETE` | `/api/clients/{id}` | 204, or 404 when absent |

### Sales — `MicroService3`

| Method | Path | Notes |
| --- | --- | --- |
| `GET` | `/api/ventes` | List |
| `GET` | `/api/ventes/client/{clientId}` | Sales for one customer |
| `POST` | `/api/ventes/add` | Needs `client.id` and `produit.id`; date defaults to now |
| `GET` | `/api/ventes/produits` | Proxied from MicroService1 via Consul |
| `GET` | `/api/ventes/clients` | Proxied from MicroService2 via Consul |
| `GET` | `/api/ventes/produits/{id}`, `/api/ventes/clients/{id}` | Single item, proxied |
| `POST` | `/api/ventes/produits/add`, `/api/ventes/clients/add` | Create, proxied |

Creating a sale:

```json
{ "client": { "id": 1 }, "produit": { "id": 2 }, "quantite": 3 }
```

### Auth — `MicroServiceAuth`

`POST /api/auth/register` (201, or 409 if the username is taken) ·
`POST /api/auth/login` (200 with a token, or 401) · `GET /api/auth/me` (who the token belongs to)

## Configuration

Every service reads these from the environment, with the defaults shown:

| Variable | Default | Applies to |
| --- | --- | --- |
| `SERVER_PORT` | per service | all |
| `CONSUL_HOST` / `CONSUL_PORT` | `localhost` / `8500` | all |
| `DB_HOST` / `DB_PORT` | `localhost` / `3306` | the four data services |
| `DB_NAME` | `springbootDB` | the four data services |
| `DB_USER` / `DB_PASSWORD` | `root` / *(empty)* | the four data services |
| `DDL_AUTO` | `update` | the four data services |
| `CORS_ORIGINS` | `http://localhost:4200` | gateway |
| `JWT_SECRET` | a development placeholder | auth |
| `JWT_EXPIRATION_MS` | `36000000` (10h) | auth |

`JWT_SECRET` must be at least 32 bytes and has to be replaced outside development — anyone
holding it can mint valid tokens.

## Tests

```bash
cd salesback && mvn test
```

The `contextLoads` tests run against in-memory H2 with Consul switched off, so they need no
infrastructure.

## Known gaps

These are deliberate and worth knowing about before building on this:

1. **The domain services are unauthenticated.** The gateway forwards requests without checking
   the token, and MicroService1/2/3 have no `SecurityFilterChain`. The next step is a gateway
   filter that validates the JWT and rejects anonymous calls to `/api/produits`, `/api/clients`
   and `/api/ventes`, with `/api/auth/**` left public — which works now that the signing key is
   shared configuration rather than a value regenerated at each startup.
2. **One database for all services.** Every service points at `springbootDB`, and `Vente` has
   real foreign keys to the `clients` and `produits` tables that MicroService2 and MicroService1
   own. MicroService3 therefore reaches the same data two ways: over HTTP and directly through
   JPA. A schema per service is the textbook answer; this shape trades that isolation away.
3. **`Client` is duplicated** in MicroService2 and MicroService3, and `Produit` in MicroService1
   and MicroService3, as full `@Entity` copies rather than shared response models.
4. **No resilience around the service-to-service calls.** They have timeouts, but no retry,
   circuit breaker or fallback, so MicroService3 answers `502`/`503` whenever a dependency is
   down.
5. **No bean validation** on request bodies, and no `@ControllerAdvice`, so bad input surfaces
   as a raw 500 rather than a 400 with a useful message.
6. **`Produit.prix` is a `float`.** Money belongs in `BigDecimal`; binary floating point cannot
   represent decimal cents exactly.
7. **No Angular client.** One existed as a git submodule and was removed; the broken submodule
   reference has been cleaned out of the repository.
