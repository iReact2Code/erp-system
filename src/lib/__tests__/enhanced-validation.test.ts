import {
  safeStringSchema,
  secureEmailSchema,
  securePasswordSchema,
} from '../enhanced-validation'

describe('Enhanced Validation Schemas', () => {
  describe('safeStringSchema', () => {
    it('should reject SQL injection patterns', () => {
      const schema = safeStringSchema(100)

      expect(() => schema.parse("'; DROP TABLE users; --")).toThrow()
      expect(() => schema.parse('SELECT * FROM users')).toThrow()
      expect(() => schema.parse('UNION SELECT')).toThrow()
    })

    it('should reject XSS patterns', () => {
      const schema = safeStringSchema(100)

      expect(() => schema.parse('<script>alert("xss")</script>')).toThrow()
      expect(() => schema.parse('<iframe src="malicious"></iframe>')).toThrow()
      expect(() => schema.parse('javascript:alert(1)')).toThrow()
    })

    it('should accept safe strings', () => {
      const schema = safeStringSchema(100)

      expect(() => schema.parse('Hello World')).not.toThrow()
      expect(() => schema.parse('Product Name 123')).not.toThrow()
      expect(() =>
        schema.parse('Valid text with special chars: @#$%')
      ).not.toThrow()
    })
  })

  describe('secureEmailSchema', () => {
    it('should accept valid emails', () => {
      expect(() => secureEmailSchema.parse('user@example.com')).not.toThrow()
      expect(() =>
        secureEmailSchema.parse('test.email+tag@domain.co.uk')
      ).not.toThrow()
    })

    it('should reject invalid emails', () => {
      expect(() => secureEmailSchema.parse('invalid.email')).toThrow()
      expect(() => secureEmailSchema.parse('user@')).toThrow()
      expect(() => secureEmailSchema.parse('@domain.com')).toThrow()
      expect(() => secureEmailSchema.parse('user..double@domain.com')).toThrow()
    })
  })

  describe('securePasswordSchema', () => {
    it('should accept strong passwords', () => {
      expect(() => securePasswordSchema.parse('Tr0ub4dor&3!')).not.toThrow()
      expect(() => securePasswordSchema.parse('X9#mK8$pL2@vR4')).not.toThrow()
    })

    it('should reject weak passwords', () => {
      expect(() => securePasswordSchema.parse('weak')).toThrow() // Too short
      expect(() => securePasswordSchema.parse('password123')).toThrow() // Common pattern
      expect(() => securePasswordSchema.parse('NoNumbers!')).toThrow() // No numbers
      expect(() => securePasswordSchema.parse('nouppercase123!')).toThrow() // No uppercase
      expect(() => securePasswordSchema.parse('NOLOWERCASE123!')).toThrow() // No lowercase
      expect(() => securePasswordSchema.parse('NoSpecialChars123')).toThrow() // No special chars
    })
  })
})
