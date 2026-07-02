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
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      accounts: {
        Row: {
          account_number: string
          balance: number
          created_at: string
          id: string
          name: string
          user_id: string
        }
        Insert: {
          account_number: string
          balance?: number
          created_at?: string
          id?: string
          name: string
          user_id: string
        }
        Update: {
          account_number?: string
          balance?: number
          created_at?: string
          id?: string
          name?: string
          user_id?: string
        }
        Relationships: []
      }
      cards: {
        Row: {
          brand: string
          card_number: string
          cardholder_name: string
          created_at: string
          cvc: string
          expiry_month: number
          expiry_year: number
          id: string
          user_id: string
        }
        Insert: {
          brand?: string
          card_number: string
          cardholder_name: string
          created_at?: string
          cvc: string
          expiry_month: number
          expiry_year: number
          id?: string
          user_id: string
        }
        Update: {
          brand?: string
          card_number?: string
          cardholder_name?: string
          created_at?: string
          cvc?: string
          expiry_month?: number
          expiry_year?: number
          id?: string
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          address: string | null
          country: string | null
          created_at: string
          email: string
          full_name: string | null
          id: string
          username: string | null
        }
        Insert: {
          address?: string | null
          country?: string | null
          created_at?: string
          email: string
          full_name?: string | null
          id: string
          username?: string | null
        }
        Update: {
          address?: string | null
          country?: string | null
          created_at?: string
          email?: string
          full_name?: string | null
          id?: string
          username?: string | null
        }
        Relationships: []
      }
      transactions: {
        Row: {
          account_id: string
          amount: number
          category: string
          counterparty_account_id: string | null
          created_at: string
          description: string | null
          id: string
          recipient_account: string | null
          recipient_bank: string | null
          recipient_country: string | null
          recipient_name: string | null
          recipient_routing: string | null
          recipient_swift: string | null
          reference: string | null
          type: string
        }
        Insert: {
          account_id: string
          amount: number
          category?: string
          counterparty_account_id?: string | null
          created_at?: string
          description?: string | null
          id?: string
          recipient_account?: string | null
          recipient_bank?: string | null
          recipient_country?: string | null
          recipient_name?: string | null
          recipient_routing?: string | null
          recipient_swift?: string | null
          reference?: string | null
          type: string
        }
        Update: {
          account_id?: string
          amount?: number
          category?: string
          counterparty_account_id?: string | null
          created_at?: string
          description?: string | null
          id?: string
          recipient_account?: string | null
          recipient_bank?: string | null
          recipient_country?: string | null
          recipient_name?: string | null
          recipient_routing?: string | null
          recipient_swift?: string | null
          reference?: string | null
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "transactions_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transactions_counterparty_account_id_fkey"
            columns: ["counterparty_account_id"]
            isOneToOne: false
            referencedRelation: "accounts"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      find_primary_account_by_email: {
        Args: { _email: string }
        Returns: {
          account_id: string
          full_name: string
          user_id: string
        }[]
      }
      generate_account_number: { Args: never; Returns: string }
      generate_card_number: { Args: never; Returns: string }
      generate_reference: { Args: never; Returns: string }
      perform_external_transfer: {
        Args: {
          _amount: number
          _category: string
          _description: string
          _from_account: string
          _recipient_account: string
          _recipient_bank: string
          _recipient_country: string
          _recipient_name: string
          _recipient_routing: string
          _recipient_swift: string
        }
        Returns: string
      }
      perform_transfer: {
        Args: {
          _amount: number
          _description: string
          _from_account: string
          _to_account: string
        }
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
