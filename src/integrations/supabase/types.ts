export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      building_info: {
        Row: {
          address: string | null
          building_name: string
          building_type: string | null
          city: string | null
          cooling_system: string | null
          country: string | null
          created_at: string
          energy_rating: string | null
          floors: number | null
          heating_system: string | null
          id: string
          image_url: string | null
          latitude: number | null
          longitude: number | null
          notes: string | null
          occupancy: number | null
          postal_code: string | null
          renewable_energy: boolean | null
          rooms: number | null
          solar_panels: boolean | null
          total_area: number | null
          updated_at: string
          usage_type: string | null
          year_built: number | null
        }
        Insert: {
          address?: string | null
          building_name: string
          building_type?: string | null
          city?: string | null
          cooling_system?: string | null
          country?: string | null
          created_at?: string
          energy_rating?: string | null
          floors?: number | null
          heating_system?: string | null
          id?: string
          image_url?: string | null
          latitude?: number | null
          longitude?: number | null
          notes?: string | null
          occupancy?: number | null
          postal_code?: string | null
          renewable_energy?: boolean | null
          rooms?: number | null
          solar_panels?: boolean | null
          total_area?: number | null
          updated_at?: string
          usage_type?: string | null
          year_built?: number | null
        }
        Update: {
          address?: string | null
          building_name?: string
          building_type?: string | null
          city?: string | null
          cooling_system?: string | null
          country?: string | null
          created_at?: string
          energy_rating?: string | null
          floors?: number | null
          heating_system?: string | null
          id?: string
          image_url?: string | null
          latitude?: number | null
          longitude?: number | null
          notes?: string | null
          occupancy?: number | null
          postal_code?: string | null
          renewable_energy?: boolean | null
          rooms?: number | null
          solar_panels?: boolean | null
          total_area?: number | null
          updated_at?: string
          usage_type?: string | null
          year_built?: number | null
        }
        Relationships: []
      }
      energy_costs: {
        Row: {
          cost_value: number
          created_at: string
          currency: string | null
          date_recorded: string
          energy_value: number
          id: string
          item_id: string
          item_name: string
          list_type: string
          meter_reading: number
          updated_at: string
        }
        Insert: {
          cost_value?: number
          created_at?: string
          currency?: string | null
          date_recorded: string
          energy_value?: number
          id?: string
          item_id: string
          item_name: string
          list_type: string
          meter_reading?: number
          updated_at?: string
        }
        Update: {
          cost_value?: number
          created_at?: string
          currency?: string | null
          date_recorded?: string
          energy_value?: number
          id?: string
          item_id?: string
          item_name?: string
          list_type?: string
          meter_reading?: number
          updated_at?: string
        }
        Relationships: []
      }
      energy_insights: {
        Row: {
          category: string | null
          confidence_score: number | null
          created_at: string
          description: string
          expires_at: string | null
          id: string
          insight_type: string
          is_active: boolean
          metadata: Json | null
          severity: string | null
          title: string
          updated_at: string
        }
        Insert: {
          category?: string | null
          confidence_score?: number | null
          created_at?: string
          description: string
          expires_at?: string | null
          id?: string
          insight_type: string
          is_active?: boolean
          metadata?: Json | null
          severity?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          category?: string | null
          confidence_score?: number | null
          created_at?: string
          description?: string
          expires_at?: string | null
          id?: string
          insight_type?: string
          is_active?: boolean
          metadata?: Json | null
          severity?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      energy_readings: {
        Row: {
          battery_level: number | null
          cost_estimate: number | null
          created_at: string
          current_power: number
          daily_energy: number
          efficiency_score: number | null
          grid_power: number
          humidity: number | null
          id: string
          pv_power: number
          recorded_at: string
          temperature: number | null
          weather_condition: string | null
        }
        Insert: {
          battery_level?: number | null
          cost_estimate?: number | null
          created_at?: string
          current_power?: number
          daily_energy?: number
          efficiency_score?: number | null
          grid_power?: number
          humidity?: number | null
          id?: string
          pv_power?: number
          recorded_at?: string
          temperature?: number | null
          weather_condition?: string | null
        }
        Update: {
          battery_level?: number | null
          cost_estimate?: number | null
          created_at?: string
          current_power?: number
          daily_energy?: number
          efficiency_score?: number | null
          grid_power?: number
          humidity?: number | null
          id?: string
          pv_power?: number
          recorded_at?: string
          temperature?: number | null
          weather_condition?: string | null
        }
        Relationships: []
      }
      system_alarms: {
        Row: {
          alarm_type: string
          created_at: string
          description: string
          end_time: string | null
          id: string
          metadata: Json | null
          severity: string
          source_system: string
          start_time: string
          status: string
          updated_at: string
        }
        Insert: {
          alarm_type: string
          created_at?: string
          description: string
          end_time?: string | null
          id?: string
          metadata?: Json | null
          severity?: string
          source_system?: string
          start_time: string
          status?: string
          updated_at?: string
        }
        Update: {
          alarm_type?: string
          created_at?: string
          description?: string
          end_time?: string | null
          id?: string
          metadata?: Json | null
          severity?: string
          source_system?: string
          start_time?: string
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      teams_configuration: {
        Row: {
          created_at: string
          id: string
          is_active: boolean
          name: string
          notification_types: string[]
          severity_levels: string[]
          updated_at: string
          user_roles: string[]
          webhook_url: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_active?: boolean
          name: string
          notification_types?: string[]
          severity_levels?: string[]
          updated_at?: string
          user_roles?: string[]
          webhook_url: string
        }
        Update: {
          created_at?: string
          id?: string
          is_active?: boolean
          name?: string
          notification_types?: string[]
          severity_levels?: string[]
          updated_at?: string
          user_roles?: string[]
          webhook_url?: string
        }
        Relationships: []
      }
      weather_data: {
        Row: {
          created_at: string
          humidity: number | null
          id: string
          pressure: number | null
          recorded_at: string
          source_system: string
          temperature: number | null
          weather_condition: string | null
          wind_speed: number | null
        }
        Insert: {
          created_at?: string
          humidity?: number | null
          id?: string
          pressure?: number | null
          recorded_at: string
          source_system?: string
          temperature?: number | null
          weather_condition?: string | null
          wind_speed?: number | null
        }
        Update: {
          created_at?: string
          humidity?: number | null
          id?: string
          pressure?: number | null
          recorded_at?: string
          source_system?: string
          temperature?: number | null
          weather_condition?: string | null
          wind_speed?: number | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      cleanup_expired_insights: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
