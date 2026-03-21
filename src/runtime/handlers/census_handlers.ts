// runtime/handlers/census_handlers.ts
// Thin adapters between commands and services

import { CommandResult, RuntimeContext } from "../models";

export class CensusHandlers {
  constructor(private census_service: any) {}

  async upload_census(
    payload: Record<string, any>,
    context: RuntimeContext
  ): Promise<CommandResult> {
    try {
      const result = await this.census_service.parse_census_file({
        benefit_case_id: payload.benefit_case_id,
        file_name: payload.file_name,
        file_url: payload.file_url,
        context,
      });

      return {
        success: true,
        data: result,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
        error_code: "CENSUS_UPLOAD_FAILED",
      };
    }
  }

  async validate_census(
    payload: Record<string, any>,
    context: RuntimeContext
  ): Promise<CommandResult> {
    try {
      const result = await this.census_service.validate_census_batch({
        benefit_case_id: payload.benefit_case_id,
        census_version_id: payload.census_version_id,
        context,
      });

      return {
        success: true,
        data: result,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
        error_code: "CENSUS_VALIDATION_FAILED",
      };
    }
  }

  async create_census_version(
    payload: Record<string, any>,
    context: RuntimeContext
  ): Promise<CommandResult> {
    try {
      const result = await this.census_service.create_census_version({
        benefit_case_id: payload.benefit_case_id,
        census_batch_id: payload.census_batch_id,
        auto_approve: payload.auto_approve || false,
        context,
      });

      return {
        success: true,
        data: result,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
        error_code: "CENSUS_VERSION_CREATION_FAILED",
      };
    }
  }
}

export class QuoteHandlers {
  constructor(private quote_service: any) {}

  async build_quote_request(
    payload: Record<string, any>,
    context: RuntimeContext
  ): Promise<CommandResult> {
    try {
      const result = await this.quote_service.build_quote_request({
        benefit_case_id: payload.benefit_case_id,
        census_version_id: payload.census_version_id,
        scenario_config: payload.scenario_config,
        context,
      });

      return {
        success: true,
        data: result,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
        error_code: "QUOTE_REQUEST_FAILED",
      };
    }
  }

  async run_quote_scenario(
    payload: Record<string, any>,
    context: RuntimeContext
  ): Promise<CommandResult> {
    try {
      const result = await this.quote_service.run_quote_scenario({
        quote_request_id: payload.quote_request_id,
        scenario_input: payload.scenario_input,
        context,
      });

      return {
        success: true,
        data: result,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
        error_code: "QUOTE_SCENARIO_FAILED",
      };
    }
  }

  async generate_quote_comparison(
    payload: Record<string, any>,
    context: RuntimeContext
  ): Promise<CommandResult> {
    try {
      const result = await this.quote_service.generate_quote_comparison({
        quote_request_id: payload.quote_request_id,
        context,
      });

      return {
        success: true,
        data: result,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
        error_code: "QUOTE_COMPARISON_FAILED",
      };
    }
  }
}

export class EnrollmentHandlers {
  constructor(private enrollment_service: any) {}

  async open_enrollment(
    payload: Record<string, any>,
    context: RuntimeContext
  ): Promise<CommandResult> {
    try {
      const result = await this.enrollment_service.open_enrollment({
        benefit_case_id: payload.benefit_case_id,
        start_date: payload.start_date,
        end_date: payload.end_date,
        context,
      });

      return {
        success: true,
        data: result,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
        error_code: "ENROLLMENT_OPEN_FAILED",
      };
    }
  }

  async invite_eligible_members(
    payload: Record<string, any>,
    context: RuntimeContext
  ): Promise<CommandResult> {
    try {
      const result = await this.enrollment_service.invite_eligible_members({
        benefit_case_id: payload.benefit_case_id,
        enrollment_window_id: payload.enrollment_window_id,
        context,
      });

      return {
        success: true,
        data: result,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
        error_code: "ENROLLMENT_INVITE_FAILED",
      };
    }
  }

  async finalize_enrollment(
    payload: Record<string, any>,
    context: RuntimeContext
  ): Promise<CommandResult> {
    try {
      const result = await this.enrollment_service.finalize_enrollment({
        benefit_case_id: payload.benefit_case_id,
        enrollment_window_id: payload.enrollment_window_id,
        context,
      });

      return {
        success: true,
        data: result,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
        error_code: "ENROLLMENT_FINALIZE_FAILED",
      };
    }
  }
}