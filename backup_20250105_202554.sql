--
-- PostgreSQL database dump
--

-- Dumped from database version 14.15 (Homebrew)
-- Dumped by pg_dump version 14.15 (Homebrew)

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: uuid-ossp; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA public;


--
-- Name: EXTENSION "uuid-ossp"; Type: COMMENT; Schema: -; Owner: 
--

COMMENT ON EXTENSION "uuid-ossp" IS 'generate universally unique identifiers (UUIDs)';


--
-- Name: inspections_method_enum; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.inspections_method_enum AS ENUM (
    'MANUAL',
    'AI'
);


ALTER TYPE public.inspections_method_enum OWNER TO postgres;

--
-- Name: inspections_status_enum; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.inspections_status_enum AS ENUM (
    'PENDING',
    'IN_PROGRESS',
    'COMPLETED',
    'FAILED'
);


ALTER TYPE public.inspections_status_enum OWNER TO postgres;

--
-- Name: notifications_status_enum; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.notifications_status_enum AS ENUM (
    'PENDING',
    'SENT',
    'READ',
    'FAILED'
);


ALTER TYPE public.notifications_status_enum OWNER TO postgres;

--
-- Name: notifications_type_enum; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.notifications_type_enum AS ENUM (
    'OFFER_CREATED',
    'OFFER_UPDATED',
    'OFFER_ACCEPTED',
    'REJECTED',
    'OFFER_EXPIRED',
    'RATING_RECEIVED',
    'QUALITY_UPDATED',
    'PRICE_UPDATED'
);


ALTER TYPE public.notifications_type_enum OWNER TO postgres;

--
-- Name: offers_status_enum; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.offers_status_enum AS ENUM (
    'PENDING',
    'ACCEPTED',
    'REJECTED',
    'CANCELLED',
    'EXPIRED'
);


ALTER TYPE public.offers_status_enum OWNER TO postgres;

--
-- Name: produces_status_enum; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.produces_status_enum AS ENUM (
    'AVAILABLE',
    'IN_PROGRESS',
    'SOLD',
    'CANCELLED'
);


ALTER TYPE public.produces_status_enum OWNER TO postgres;

--
-- Name: qualities_grade_enum; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.qualities_grade_enum AS ENUM (
    'A',
    'B',
    'C',
    'D',
    'PENDING',
    'REJECTED'
);


ALTER TYPE public.qualities_grade_enum OWNER TO postgres;

--
-- Name: quality_assessments_grade_enum; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.quality_assessments_grade_enum AS ENUM (
    'A',
    'B',
    'C',
    'D',
    'REJECTED'
);


ALTER TYPE public.quality_assessments_grade_enum OWNER TO postgres;

--
-- Name: support_tickets_category_enum; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.support_tickets_category_enum AS ENUM (
    'GENERAL',
    'TECHNICAL',
    'BILLING',
    'ACCOUNT',
    'ORDER',
    'OTHER'
);


ALTER TYPE public.support_tickets_category_enum OWNER TO postgres;

--
-- Name: support_tickets_priority_enum; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.support_tickets_priority_enum AS ENUM (
    'LOW',
    'MEDIUM',
    'HIGH',
    'URGENT'
);


ALTER TYPE public.support_tickets_priority_enum OWNER TO postgres;

--
-- Name: support_tickets_status_enum; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.support_tickets_status_enum AS ENUM (
    'OPEN',
    'IN_PROGRESS',
    'RESOLVED',
    'CLOSED'
);


ALTER TYPE public.support_tickets_status_enum OWNER TO postgres;

--
-- Name: tickets_category_enum; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.tickets_category_enum AS ENUM (
    'PRICE_ISSUE',
    'QUALITY_DISPUTE',
    'PAYMENT_ISSUE',
    'DELIVERY_ISSUE',
    'TECHNICAL_ISSUE',
    'OTHER'
);


ALTER TYPE public.tickets_category_enum OWNER TO postgres;

--
-- Name: tickets_priority_enum; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.tickets_priority_enum AS ENUM (
    'LOW',
    'MEDIUM',
    'HIGH',
    'URGENT'
);


ALTER TYPE public.tickets_priority_enum OWNER TO postgres;

--
-- Name: tickets_status_enum; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.tickets_status_enum AS ENUM (
    'OPEN',
    'IN_PROGRESS',
    'PENDING_USER',
    'RESOLVED',
    'CLOSED'
);


ALTER TYPE public.tickets_status_enum OWNER TO postgres;

--
-- Name: transactions_status_enum; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.transactions_status_enum AS ENUM (
    'PENDING',
    'COMPLETED',
    'CANCELLED',
    'FAILED'
);


ALTER TYPE public.transactions_status_enum OWNER TO postgres;

--
-- Name: users_roles_enum; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.users_roles_enum AS ENUM (
    'FARMER',
    'BUYER',
    'ADMIN'
);


ALTER TYPE public.users_roles_enum OWNER TO postgres;

--
-- Name: users_status_enum; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.users_status_enum AS ENUM (
    'ACTIVE',
    'INACTIVE',
    'SUSPENDED',
    'PENDING_VERIFICATION',
    'DELETED'
);


ALTER TYPE public.users_status_enum OWNER TO postgres;

--
-- Name: users_verificationstatus_enum; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.users_verificationstatus_enum AS ENUM (
    'PENDING',
    'VERIFIED',
    'REJECTED'
);


ALTER TYPE public.users_verificationstatus_enum OWNER TO postgres;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: auto_offer_rules; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.auto_offer_rules (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    "priceChangeExpiry" boolean DEFAULT true NOT NULL,
    "significantPriceChangePercent" numeric(5,2) DEFAULT '10'::numeric NOT NULL,
    "defaultExpiryHours" integer DEFAULT 24 NOT NULL,
    "maxActiveOffersPerProduce" integer DEFAULT 5 NOT NULL,
    "graceMinutes" integer DEFAULT 15 NOT NULL,
    "maxSimultaneousOffers" integer DEFAULT 3 NOT NULL,
    "priorityOrder" text DEFAULT 'rating,distance,historicalTransactions'::text NOT NULL,
    "createdAt" timestamp without time zone DEFAULT now() NOT NULL,
    "updatedAt" timestamp without time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.auto_offer_rules OWNER TO postgres;

--
-- Name: bank_details; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.bank_details (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    "accountName" character varying NOT NULL,
    "accountNumber" character varying NOT NULL,
    "bankName" character varying NOT NULL,
    "branchCode" character varying NOT NULL,
    "farmerId" uuid NOT NULL,
    "isPrimary" boolean DEFAULT false NOT NULL,
    "createdAt" timestamp without time zone DEFAULT now() NOT NULL,
    "updatedAt" timestamp without time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.bank_details OWNER TO postgres;

--
-- Name: buyer_prices; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.buyer_prices (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    "buyerId" uuid NOT NULL,
    "qualityGrade" character varying NOT NULL,
    "pricePerUnit" numeric(10,2) NOT NULL,
    "effectiveDate" date NOT NULL,
    "isActive" boolean DEFAULT true NOT NULL,
    "createdAt" timestamp without time zone DEFAULT now() NOT NULL,
    "updatedAt" timestamp without time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.buyer_prices OWNER TO postgres;

--
-- Name: buyers; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.buyers (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    "userId" character varying NOT NULL,
    name character varying NOT NULL,
    email character varying NOT NULL,
    phone character varying NOT NULL,
    location json NOT NULL,
    "businessDetails" json NOT NULL,
    "isActive" boolean DEFAULT true NOT NULL,
    rating numeric(3,2) DEFAULT '0'::numeric NOT NULL,
    "totalRatings" integer DEFAULT 0 NOT NULL,
    "createdAt" timestamp without time zone NOT NULL,
    "updatedAt" timestamp without time zone NOT NULL
);


ALTER TABLE public.buyers OWNER TO postgres;

--
-- Name: farm_details; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.farm_details (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    size numeric(10,2),
    "sizeUnit" character varying,
    name character varying,
    address character varying,
    location jsonb,
    "farmerId" uuid NOT NULL,
    "createdAt" timestamp without time zone DEFAULT now() NOT NULL,
    "updatedAt" timestamp without time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.farm_details OWNER TO postgres;

--
-- Name: farmers; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.farmers (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    "userId" character varying NOT NULL,
    rating numeric(3,2) DEFAULT '0'::numeric NOT NULL,
    "totalRatings" integer DEFAULT 0 NOT NULL,
    "createdAt" timestamp without time zone DEFAULT now() NOT NULL,
    "updatedAt" timestamp without time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.farmers OWNER TO postgres;

--
-- Name: inspections; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.inspections (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    "produceId" uuid NOT NULL,
    "inspectorId" uuid,
    "qualityId" uuid,
    status public.inspections_status_enum DEFAULT 'PENDING'::public.inspections_status_enum NOT NULL,
    method public.inspections_method_enum DEFAULT 'MANUAL'::public.inspections_method_enum NOT NULL,
    metadata jsonb,
    "aiResults" jsonb,
    notes text,
    "completedAt" timestamp without time zone,
    "createdAt" timestamp without time zone DEFAULT now() NOT NULL,
    "updatedAt" timestamp without time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.inspections OWNER TO postgres;

--
-- Name: notifications; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.notifications (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    user_id uuid NOT NULL,
    title character varying NOT NULL,
    message text NOT NULL,
    type public.notifications_type_enum NOT NULL,
    status public.notifications_status_enum DEFAULT 'PENDING'::public.notifications_status_enum NOT NULL,
    metadata jsonb,
    sent_at timestamp without time zone,
    read_at timestamp without time zone,
    created_at timestamp without time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.notifications OWNER TO postgres;

--
-- Name: offers; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.offers (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    "produceId" uuid NOT NULL,
    "buyerId" uuid NOT NULL,
    "pricePerUnit" numeric(10,2) NOT NULL,
    quantity numeric(10,2) NOT NULL,
    status public.offers_status_enum DEFAULT 'PENDING'::public.offers_status_enum NOT NULL,
    metadata jsonb,
    message character varying,
    "validUntil" timestamp without time zone,
    "createdAt" timestamp without time zone DEFAULT now() NOT NULL,
    "updatedAt" timestamp without time zone DEFAULT now() NOT NULL,
    "acceptedAt" timestamp without time zone,
    "rejectedAt" timestamp without time zone,
    "rejectionReason" character varying,
    "cancelledAt" timestamp without time zone,
    "cancellationReason" character varying,
    produce_id uuid,
    buyer_id uuid
);


ALTER TABLE public.offers OWNER TO postgres;

--
-- Name: produces; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.produces (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    "farmerId" uuid NOT NULL,
    "farmId" uuid,
    name character varying NOT NULL,
    description character varying NOT NULL,
    quantity numeric NOT NULL,
    unit character varying NOT NULL,
    price numeric NOT NULL,
    "pricePerUnit" numeric NOT NULL,
    currency character varying NOT NULL,
    status public.produces_status_enum DEFAULT 'AVAILABLE'::public.produces_status_enum NOT NULL,
    location json NOT NULL,
    "qualityGrade" character varying,
    metadata json,
    "createdAt" timestamp without time zone DEFAULT now() NOT NULL,
    "updatedAt" timestamp without time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.produces OWNER TO postgres;

--
-- Name: qualities; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.qualities (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    "produceId" character varying NOT NULL,
    grade public.qualities_grade_enum DEFAULT 'PENDING'::public.qualities_grade_enum NOT NULL,
    criteria json NOT NULL,
    metadata json,
    "assessedBy" character varying NOT NULL,
    "createdAt" timestamp without time zone NOT NULL,
    "updatedAt" timestamp without time zone NOT NULL,
    produce_id uuid
);


ALTER TABLE public.qualities OWNER TO postgres;

--
-- Name: quality_assessments; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.quality_assessments (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    "produceId" uuid NOT NULL,
    grade public.quality_assessments_grade_enum,
    criteria jsonb,
    "overallScore" numeric(5,2),
    notes character varying,
    "inspectorId" character varying,
    images jsonb,
    "createdAt" timestamp without time zone DEFAULT now() NOT NULL,
    "updatedAt" timestamp without time zone DEFAULT now() NOT NULL,
    "completedAt" timestamp without time zone,
    produce_id uuid
);


ALTER TABLE public.quality_assessments OWNER TO postgres;

--
-- Name: ratings; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.ratings (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    rated_by_user_id uuid NOT NULL,
    rated_user_id uuid NOT NULL,
    offer_id uuid NOT NULL,
    stars integer NOT NULL,
    review_text text,
    metadata jsonb,
    created_at timestamp without time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.ratings OWNER TO postgres;

--
-- Name: support_tickets; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.support_tickets (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    title character varying NOT NULL,
    description text NOT NULL,
    status public.support_tickets_status_enum DEFAULT 'OPEN'::public.support_tickets_status_enum NOT NULL,
    priority public.support_tickets_priority_enum DEFAULT 'MEDIUM'::public.support_tickets_priority_enum NOT NULL,
    category public.support_tickets_category_enum NOT NULL,
    "userId" uuid NOT NULL,
    attachments text DEFAULT '[]'::text NOT NULL,
    metadata jsonb,
    "createdAt" timestamp without time zone DEFAULT now() NOT NULL,
    "updatedAt" timestamp without time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.support_tickets OWNER TO postgres;

--
-- Name: tickets; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.tickets (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    user_id uuid NOT NULL,
    assigned_to_id uuid,
    title character varying NOT NULL,
    description text NOT NULL,
    category public.tickets_category_enum NOT NULL,
    priority public.tickets_priority_enum DEFAULT 'MEDIUM'::public.tickets_priority_enum NOT NULL,
    status public.tickets_status_enum DEFAULT 'OPEN'::public.tickets_status_enum NOT NULL,
    metadata jsonb,
    resolution_notes text,
    closed_at timestamp without time zone,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.tickets OWNER TO postgres;

--
-- Name: transactions; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.transactions (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    "produceId" uuid NOT NULL,
    "buyerId" uuid NOT NULL,
    "sellerId" uuid NOT NULL,
    "farmerId" uuid NOT NULL,
    quantity numeric(10,2) NOT NULL,
    "pricePerUnit" numeric(10,2) NOT NULL,
    status public.transactions_status_enum DEFAULT 'PENDING'::public.transactions_status_enum NOT NULL,
    metadata jsonb,
    "cancellationReason" character varying,
    "createdAt" timestamp without time zone DEFAULT now() NOT NULL,
    "updatedAt" timestamp without time zone DEFAULT now() NOT NULL,
    "completedAt" timestamp without time zone,
    "cancelledAt" timestamp without time zone,
    produce_id uuid,
    buyer_id uuid,
    seller_id uuid,
    farmer_id uuid
);


ALTER TABLE public.transactions OWNER TO postgres;

--
-- Name: users; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.users (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    email character varying NOT NULL,
    name character varying NOT NULL,
    roles public.users_roles_enum[] DEFAULT '{FARMER}'::public.users_roles_enum[] NOT NULL,
    "isBlocked" boolean DEFAULT false NOT NULL,
    "blockReason" character varying,
    metadata jsonb,
    "mobileNumber" character varying NOT NULL,
    status public.users_status_enum DEFAULT 'PENDING_VERIFICATION'::public.users_status_enum NOT NULL,
    "profilePicture" character varying,
    "lastLoginAt" timestamp without time zone,
    "verifiedAt" timestamp without time zone,
    "deletedAt" timestamp without time zone,
    "scheduledForDeletionAt" timestamp without time zone,
    "createdAt" timestamp without time zone DEFAULT now() NOT NULL,
    "updatedAt" timestamp without time zone DEFAULT now() NOT NULL,
    "verificationStatus" public.users_verificationstatus_enum DEFAULT 'PENDING'::public.users_verificationstatus_enum NOT NULL,
    "isVerified" boolean DEFAULT false NOT NULL,
    phone character varying,
    "isFarmer" boolean DEFAULT false NOT NULL,
    "isBuyer" boolean DEFAULT false NOT NULL,
    "isAdmin" boolean DEFAULT false NOT NULL,
    is_quality_inspector boolean DEFAULT false NOT NULL,
    rating numeric(3,2) DEFAULT '0'::numeric NOT NULL,
    rating_count integer DEFAULT 0 NOT NULL,
    last_login_at timestamp without time zone,
    profile jsonb,
    "loginAttempts" integer DEFAULT 0 NOT NULL,
    "lastLoginAttempt" timestamp without time zone,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.users OWNER TO postgres;

--
-- Data for Name: auto_offer_rules; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.auto_offer_rules (id, "priceChangeExpiry", "significantPriceChangePercent", "defaultExpiryHours", "maxActiveOffersPerProduce", "graceMinutes", "maxSimultaneousOffers", "priorityOrder", "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: bank_details; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.bank_details (id, "accountName", "accountNumber", "bankName", "branchCode", "farmerId", "isPrimary", "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: buyer_prices; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.buyer_prices (id, "buyerId", "qualityGrade", "pricePerUnit", "effectiveDate", "isActive", "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: buyers; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.buyers (id, "userId", name, email, phone, location, "businessDetails", "isActive", rating, "totalRatings", "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: farm_details; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.farm_details (id, size, "sizeUnit", name, address, location, "farmerId", "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: farmers; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.farmers (id, "userId", rating, "totalRatings", "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: inspections; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.inspections (id, "produceId", "inspectorId", "qualityId", status, method, metadata, "aiResults", notes, "completedAt", "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: notifications; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.notifications (id, user_id, title, message, type, status, metadata, sent_at, read_at, created_at) FROM stdin;
\.


--
-- Data for Name: offers; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.offers (id, "produceId", "buyerId", "pricePerUnit", quantity, status, metadata, message, "validUntil", "createdAt", "updatedAt", "acceptedAt", "rejectedAt", "rejectionReason", "cancelledAt", "cancellationReason", produce_id, buyer_id) FROM stdin;
\.


--
-- Data for Name: produces; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.produces (id, "farmerId", "farmId", name, description, quantity, unit, price, "pricePerUnit", currency, status, location, "qualityGrade", metadata, "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: qualities; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.qualities (id, "produceId", grade, criteria, metadata, "assessedBy", "createdAt", "updatedAt", produce_id) FROM stdin;
\.


--
-- Data for Name: quality_assessments; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.quality_assessments (id, "produceId", grade, criteria, "overallScore", notes, "inspectorId", images, "createdAt", "updatedAt", "completedAt", produce_id) FROM stdin;
\.


--
-- Data for Name: ratings; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.ratings (id, rated_by_user_id, rated_user_id, offer_id, stars, review_text, metadata, created_at) FROM stdin;
\.


--
-- Data for Name: support_tickets; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.support_tickets (id, title, description, status, priority, category, "userId", attachments, metadata, "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: tickets; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.tickets (id, user_id, assigned_to_id, title, description, category, priority, status, metadata, resolution_notes, closed_at, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: transactions; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.transactions (id, "produceId", "buyerId", "sellerId", "farmerId", quantity, "pricePerUnit", status, metadata, "cancellationReason", "createdAt", "updatedAt", "completedAt", "cancelledAt", produce_id, buyer_id, seller_id, farmer_id) FROM stdin;
\.


--
-- Data for Name: users; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.users (id, email, name, roles, "isBlocked", "blockReason", metadata, "mobileNumber", status, "profilePicture", "lastLoginAt", "verifiedAt", "deletedAt", "scheduledForDeletionAt", "createdAt", "updatedAt", "verificationStatus", "isVerified", phone, "isFarmer", "isBuyer", "isAdmin", is_quality_inspector, rating, rating_count, last_login_at, profile, "loginAttempts", "lastLoginAttempt", created_at, updated_at) FROM stdin;
\.


--
-- Name: auto_offer_rules PK_06d7ff69e90feb4ae51a8b75da9; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.auto_offer_rules
    ADD CONSTRAINT "PK_06d7ff69e90feb4ae51a8b75da9" PRIMARY KEY (id);


--
-- Name: ratings PK_0f31425b073219379545ad68ed9; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.ratings
    ADD CONSTRAINT "PK_0f31425b073219379545ad68ed9" PRIMARY KEY (id);


--
-- Name: tickets PK_343bc942ae261cf7a1377f48fd0; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.tickets
    ADD CONSTRAINT "PK_343bc942ae261cf7a1377f48fd0" PRIMARY KEY (id);


--
-- Name: farm_details PK_45e9517e96827914e52be56a9ff; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.farm_details
    ADD CONSTRAINT "PK_45e9517e96827914e52be56a9ff" PRIMARY KEY (id);


--
-- Name: offers PK_4c88e956195bba85977da21b8f4; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.offers
    ADD CONSTRAINT "PK_4c88e956195bba85977da21b8f4" PRIMARY KEY (id);


--
-- Name: notifications PK_6a72c3c0f683f6462415e653c3a; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.notifications
    ADD CONSTRAINT "PK_6a72c3c0f683f6462415e653c3a" PRIMARY KEY (id);


--
-- Name: produces PK_6bf4be2d80f8c996ae439f3eaa4; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.produces
    ADD CONSTRAINT "PK_6bf4be2d80f8c996ae439f3eaa4" PRIMARY KEY (id);


--
-- Name: buyer_prices PK_90efcd8d557c1d71318dfcd6480; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.buyer_prices
    ADD CONSTRAINT "PK_90efcd8d557c1d71318dfcd6480" PRIMARY KEY (id);


--
-- Name: qualities PK_9318d6be2c65a38b149055ce361; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.qualities
    ADD CONSTRAINT "PK_9318d6be2c65a38b149055ce361" PRIMARY KEY (id);


--
-- Name: support_tickets PK_942e8d8f5df86100471d2324643; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.support_tickets
    ADD CONSTRAINT "PK_942e8d8f5df86100471d2324643" PRIMARY KEY (id);


--
-- Name: transactions PK_a219afd8dd77ed80f5a862f1db9; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.transactions
    ADD CONSTRAINT "PK_a219afd8dd77ed80f5a862f1db9" PRIMARY KEY (id);


--
-- Name: users PK_a3ffb1c0c8416b9fc6f907b7433; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT "PK_a3ffb1c0c8416b9fc6f907b7433" PRIMARY KEY (id);


--
-- Name: inspections PK_a484980015782324454d8c88abe; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.inspections
    ADD CONSTRAINT "PK_a484980015782324454d8c88abe" PRIMARY KEY (id);


--
-- Name: buyers PK_aff372821d05bac04a18ff8eb87; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.buyers
    ADD CONSTRAINT "PK_aff372821d05bac04a18ff8eb87" PRIMARY KEY (id);


--
-- Name: farmers PK_ccbe91e5e64dde1329b4c153637; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.farmers
    ADD CONSTRAINT "PK_ccbe91e5e64dde1329b4c153637" PRIMARY KEY (id);


--
-- Name: quality_assessments PK_cffdb70d95f01da9a95226e23fa; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.quality_assessments
    ADD CONSTRAINT "PK_cffdb70d95f01da9a95226e23fa" PRIMARY KEY (id);


--
-- Name: bank_details PK_ddbbcb9586b7f4d6124fe58f257; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.bank_details
    ADD CONSTRAINT "PK_ddbbcb9586b7f4d6124fe58f257" PRIMARY KEY (id);


--
-- Name: quality_assessments REL_23c258aebc15e401146df48e57; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.quality_assessments
    ADD CONSTRAINT "REL_23c258aebc15e401146df48e57" UNIQUE (produce_id);


--
-- Name: users UQ_61dc14c8c49c187f5d08047c985; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT "UQ_61dc14c8c49c187f5d08047c985" UNIQUE ("mobileNumber");


--
-- Name: users UQ_97672ac88f789774dd47f7c8be3; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT "UQ_97672ac88f789774dd47f7c8be3" UNIQUE (email);


--
-- Name: inspections FK_194218f3ea431df7b5c86a4a95f; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.inspections
    ADD CONSTRAINT "FK_194218f3ea431df7b5c86a4a95f" FOREIGN KEY ("inspectorId") REFERENCES public.users(id);


--
-- Name: transactions FK_214e8e26a3bc13250ef55e9a1af; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.transactions
    ADD CONSTRAINT "FK_214e8e26a3bc13250ef55e9a1af" FOREIGN KEY (seller_id) REFERENCES public.users(id);


--
-- Name: produces FK_229792e3abac0d5e9475879c694; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.produces
    ADD CONSTRAINT "FK_229792e3abac0d5e9475879c694" FOREIGN KEY ("farmerId") REFERENCES public.farmers(id);


--
-- Name: quality_assessments FK_23c258aebc15e401146df48e57e; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.quality_assessments
    ADD CONSTRAINT "FK_23c258aebc15e401146df48e57e" FOREIGN KEY (produce_id) REFERENCES public.produces(id);


--
-- Name: tickets FK_2e445270177206a97921e461710; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.tickets
    ADD CONSTRAINT "FK_2e445270177206a97921e461710" FOREIGN KEY (user_id) REFERENCES public.users(id);


--
-- Name: buyer_prices FK_350038183123ca2fb87fe9913d8; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.buyer_prices
    ADD CONSTRAINT "FK_350038183123ca2fb87fe9913d8" FOREIGN KEY ("buyerId") REFERENCES public.buyers(id) ON DELETE CASCADE;


--
-- Name: ratings FK_43819ae0c5400d02e3e743aa8b6; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.ratings
    ADD CONSTRAINT "FK_43819ae0c5400d02e3e743aa8b6" FOREIGN KEY (rated_by_user_id) REFERENCES public.users(id);


--
-- Name: transactions FK_4981848ab3547ee8bca058bd0c3; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.transactions
    ADD CONSTRAINT "FK_4981848ab3547ee8bca058bd0c3" FOREIGN KEY (produce_id) REFERENCES public.produces(id);


--
-- Name: ratings FK_55eeea038e6c606e7b110026950; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.ratings
    ADD CONSTRAINT "FK_55eeea038e6c606e7b110026950" FOREIGN KEY (offer_id) REFERENCES public.offers(id);


--
-- Name: ratings FK_58e67c1ee51b4a91f58be40ed18; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.ratings
    ADD CONSTRAINT "FK_58e67c1ee51b4a91f58be40ed18" FOREIGN KEY (rated_user_id) REFERENCES public.users(id);


--
-- Name: qualities FK_5fbcdc34a6a75d3f2b389b5ce53; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.qualities
    ADD CONSTRAINT "FK_5fbcdc34a6a75d3f2b389b5ce53" FOREIGN KEY (produce_id) REFERENCES public.produces(id);


--
-- Name: inspections FK_7bf28f05b8b466eeef097bdec6a; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.inspections
    ADD CONSTRAINT "FK_7bf28f05b8b466eeef097bdec6a" FOREIGN KEY ("qualityId") REFERENCES public.qualities(id);


--
-- Name: support_tickets FK_8679e2ff150ff0e253189ca0253; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.support_tickets
    ADD CONSTRAINT "FK_8679e2ff150ff0e253189ca0253" FOREIGN KEY ("userId") REFERENCES public.users(id);


--
-- Name: inspections FK_8731c935ef4f110f3a77e412374; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.inspections
    ADD CONSTRAINT "FK_8731c935ef4f110f3a77e412374" FOREIGN KEY ("produceId") REFERENCES public.produces(id);


--
-- Name: transactions FK_8c9b301d18f4ed8cacff33664c6; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.transactions
    ADD CONSTRAINT "FK_8c9b301d18f4ed8cacff33664c6" FOREIGN KEY (buyer_id) REFERENCES public.users(id);


--
-- Name: offers FK_8d62085256bc739c02d49a3c20e; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.offers
    ADD CONSTRAINT "FK_8d62085256bc739c02d49a3c20e" FOREIGN KEY (buyer_id) REFERENCES public.users(id);


--
-- Name: notifications FK_9a8a82462cab47c73d25f49261f; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.notifications
    ADD CONSTRAINT "FK_9a8a82462cab47c73d25f49261f" FOREIGN KEY (user_id) REFERENCES public.users(id);


--
-- Name: transactions FK_9b5d40c044526531753a2a8b18a; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.transactions
    ADD CONSTRAINT "FK_9b5d40c044526531753a2a8b18a" FOREIGN KEY (farmer_id) REFERENCES public.farmers(id);


--
-- Name: bank_details FK_b3dacd0cb918abb50d810e2fc8e; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.bank_details
    ADD CONSTRAINT "FK_b3dacd0cb918abb50d810e2fc8e" FOREIGN KEY ("farmerId") REFERENCES public.farmers(id);


--
-- Name: tickets FK_b564a18159530b5a56aeac33d1a; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.tickets
    ADD CONSTRAINT "FK_b564a18159530b5a56aeac33d1a" FOREIGN KEY (assigned_to_id) REFERENCES public.users(id);


--
-- Name: offers FK_cea0cff8edd5f0241126843ee0d; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.offers
    ADD CONSTRAINT "FK_cea0cff8edd5f0241126843ee0d" FOREIGN KEY (produce_id) REFERENCES public.produces(id);


--
-- Name: produces FK_dffef3daf0eceabfa5659858eef; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.produces
    ADD CONSTRAINT "FK_dffef3daf0eceabfa5659858eef" FOREIGN KEY ("farmId") REFERENCES public.farm_details(id);


--
-- Name: farm_details FK_f3ce1cccb5546502a8c3e6ef657; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.farm_details
    ADD CONSTRAINT "FK_f3ce1cccb5546502a8c3e6ef657" FOREIGN KEY ("farmerId") REFERENCES public.farmers(id);


--
-- PostgreSQL database dump complete
--

