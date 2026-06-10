CREATE TYPE "public"."approval_status_enum" AS ENUM('pending_hrga', 'pending_finance', 'approved', 'rejected');--> statement-breakpoint
CREATE TYPE "public"."asset_status_enum" AS ENUM('active', 'idle', 'under_maintenance', 'disposed');--> statement-breakpoint
CREATE TYPE "public"."asset_type_enum" AS ENUM('appliance', 'vehicle');--> statement-breakpoint
CREATE TYPE "public"."fuel_type_enum" AS ENUM('gasoline', 'diesel', 'electric', 'hybrid');--> statement-breakpoint
CREATE TABLE "account" (
	"userId" text NOT NULL,
	"type" text NOT NULL,
	"provider" text NOT NULL,
	"providerAccountId" text NOT NULL,
	"refresh_token" text,
	"access_token" text,
	"expires_at" integer,
	"token_type" text,
	"scope" text,
	"id_token" text,
	"session_state" text,
	CONSTRAINT "account_provider_providerAccountId_pk" PRIMARY KEY("provider","providerAccountId")
);
--> statement-breakpoint
CREATE TABLE "assets" (
	"asset_id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"asset_tag_code" varchar NOT NULL,
	"asset_type" "asset_type_enum" NOT NULL,
	"asset_name" varchar NOT NULL,
	"status" "asset_status_enum" DEFAULT 'active' NOT NULL,
	"location_id" varchar NOT NULL,
	"cost_center_id" varchar NOT NULL,
	"purchase_date" date NOT NULL,
	"purchase_cost" numeric(15, 2) NOT NULL,
	"vendor_name" varchar NOT NULL,
	"warranty_expiry" date,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"deleted_at" timestamp,
	CONSTRAINT "assets_asset_tag_code_unique" UNIQUE("asset_tag_code")
);
--> statement-breakpoint
CREATE TABLE "cost_centers" (
	"cost_center_id" varchar PRIMARY KEY NOT NULL,
	"department_name" varchar NOT NULL,
	"division" varchar NOT NULL
);
--> statement-breakpoint
CREATE TABLE "discrepancy_logs" (
	"log_id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"asset_id" uuid NOT NULL,
	"expected_location_id" varchar NOT NULL,
	"scanned_location_id" varchar NOT NULL,
	"recorded_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "locations" (
	"location_id" varchar PRIMARY KEY NOT NULL,
	"site_name" varchar NOT NULL,
	"floor" varchar NOT NULL,
	"room_or_section" varchar NOT NULL
);
--> statement-breakpoint
CREATE TABLE "odometer_logs" (
	"log_id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"vehicle_id" uuid NOT NULL,
	"old_reading" integer NOT NULL,
	"new_reading" integer NOT NULL,
	"recorded_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "office_appliances" (
	"appliance_id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"asset_id" uuid NOT NULL,
	"brand" varchar NOT NULL,
	"model_number" varchar NOT NULL,
	"serial_number" varchar NOT NULL,
	"power_rating_watts" integer,
	"is_bulk" boolean DEFAULT false NOT NULL,
	"quantity" integer DEFAULT 1 NOT NULL,
	CONSTRAINT "office_appliances_serial_number_unique" UNIQUE("serial_number")
);
--> statement-breakpoint
CREATE TABLE "permissions" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"description" text,
	CONSTRAINT "permissions_name_unique" UNIQUE("name")
);
--> statement-breakpoint
CREATE TABLE "role_permissions" (
	"role_id" text NOT NULL,
	"permission_id" text NOT NULL,
	CONSTRAINT "role_permissions_role_id_permission_id_pk" PRIMARY KEY("role_id","permission_id")
);
--> statement-breakpoint
CREATE TABLE "roles" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"description" text,
	CONSTRAINT "roles_name_unique" UNIQUE("name")
);
--> statement-breakpoint
CREATE TABLE "session" (
	"sessionToken" text PRIMARY KEY NOT NULL,
	"userId" text NOT NULL,
	"expires" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE "status_change_requests" (
	"request_id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"asset_id" uuid NOT NULL,
	"requested_status" "asset_status_enum" NOT NULL,
	"reason_or_notes" text NOT NULL,
	"evidence_url" varchar,
	"estimated_cost" numeric(15, 2),
	"approval_status" "approval_status_enum" DEFAULT 'pending_hrga' NOT NULL,
	"hrga_reviewed_by" text,
	"finance_reviewed_by" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "user_roles" (
	"user_id" text NOT NULL,
	"role_id" text NOT NULL,
	CONSTRAINT "user_roles_user_id_role_id_pk" PRIMARY KEY("user_id","role_id")
);
--> statement-breakpoint
CREATE TABLE "user" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text,
	"email" text,
	"emailVerified" timestamp,
	"image" text,
	"password" text,
	CONSTRAINT "user_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "vehicles" (
	"vehicle_id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"asset_id" uuid NOT NULL,
	"license_plate" varchar NOT NULL,
	"vin_number" varchar NOT NULL,
	"engine_number" varchar NOT NULL,
	"make" varchar NOT NULL,
	"model" varchar NOT NULL,
	"manufacture_year" integer NOT NULL,
	"fuel_type" "fuel_type_enum" NOT NULL,
	"current_odometer" integer NOT NULL,
	"registration_expiry" date NOT NULL,
	"safety_inspection_expiry" date,
	"insurance_policy_no" varchar NOT NULL,
	"insurance_expiry" date NOT NULL,
	CONSTRAINT "vehicles_license_plate_unique" UNIQUE("license_plate"),
	CONSTRAINT "vehicles_vin_number_unique" UNIQUE("vin_number"),
	CONSTRAINT "vehicles_engine_number_unique" UNIQUE("engine_number")
);
--> statement-breakpoint
CREATE TABLE "verificationToken" (
	"identifier" text NOT NULL,
	"token" text NOT NULL,
	"expires" timestamp NOT NULL,
	CONSTRAINT "verificationToken_identifier_token_pk" PRIMARY KEY("identifier","token")
);
--> statement-breakpoint
ALTER TABLE "account" ADD CONSTRAINT "account_userId_user_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "assets" ADD CONSTRAINT "assets_location_id_locations_location_id_fk" FOREIGN KEY ("location_id") REFERENCES "public"."locations"("location_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "assets" ADD CONSTRAINT "assets_cost_center_id_cost_centers_cost_center_id_fk" FOREIGN KEY ("cost_center_id") REFERENCES "public"."cost_centers"("cost_center_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "discrepancy_logs" ADD CONSTRAINT "discrepancy_logs_asset_id_assets_asset_id_fk" FOREIGN KEY ("asset_id") REFERENCES "public"."assets"("asset_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "discrepancy_logs" ADD CONSTRAINT "discrepancy_logs_expected_location_id_locations_location_id_fk" FOREIGN KEY ("expected_location_id") REFERENCES "public"."locations"("location_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "discrepancy_logs" ADD CONSTRAINT "discrepancy_logs_scanned_location_id_locations_location_id_fk" FOREIGN KEY ("scanned_location_id") REFERENCES "public"."locations"("location_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "odometer_logs" ADD CONSTRAINT "odometer_logs_vehicle_id_vehicles_vehicle_id_fk" FOREIGN KEY ("vehicle_id") REFERENCES "public"."vehicles"("vehicle_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "office_appliances" ADD CONSTRAINT "office_appliances_asset_id_assets_asset_id_fk" FOREIGN KEY ("asset_id") REFERENCES "public"."assets"("asset_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "role_permissions" ADD CONSTRAINT "role_permissions_role_id_roles_id_fk" FOREIGN KEY ("role_id") REFERENCES "public"."roles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "role_permissions" ADD CONSTRAINT "role_permissions_permission_id_permissions_id_fk" FOREIGN KEY ("permission_id") REFERENCES "public"."permissions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "session" ADD CONSTRAINT "session_userId_user_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "status_change_requests" ADD CONSTRAINT "status_change_requests_asset_id_assets_asset_id_fk" FOREIGN KEY ("asset_id") REFERENCES "public"."assets"("asset_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "status_change_requests" ADD CONSTRAINT "status_change_requests_hrga_reviewed_by_user_id_fk" FOREIGN KEY ("hrga_reviewed_by") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "status_change_requests" ADD CONSTRAINT "status_change_requests_finance_reviewed_by_user_id_fk" FOREIGN KEY ("finance_reviewed_by") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_roles" ADD CONSTRAINT "user_roles_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_roles" ADD CONSTRAINT "user_roles_role_id_roles_id_fk" FOREIGN KEY ("role_id") REFERENCES "public"."roles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "vehicles" ADD CONSTRAINT "vehicles_asset_id_assets_asset_id_fk" FOREIGN KEY ("asset_id") REFERENCES "public"."assets"("asset_id") ON DELETE cascade ON UPDATE no action;