# Contact Validation Guide

## 📋 Overview

The form now validates contact information as either:
1. **Valid Email Address**
2. **Valid Philippine Phone Number - EXACTLY 11 DIGITS ONLY**

---

## ✅ Email Validation

### Valid Email Examples
```
john@gmail.com
user@example.com
contact@company.ph
support@website.org
person.name@email.com
user123@domain.co.uk
```

### Invalid Email Examples
```
john                          ❌ No @ symbol
john@                         ❌ No domain
john@gmail                    ❌ No extension
@gmail.com                    ❌ No username
john@@gmail.com               ❌ Double @
john gmail@gmail.com          ❌ Space in email
```

### Email Validation Rule
```
Format: username@domain.extension
Must have: @ symbol, domain, and extension
```

---

## 📱 Philippine Phone Validation - 11 DIGITS ONLY

### ✅ ONLY Valid Format: 11 Digits

```
09171234567     ✅ VALID (11 digits)
09065432109     ✅ VALID (11 digits)
09361111111     ✅ VALID (11 digits)
09475555555     ✅ VALID (11 digits)
09121234567     ✅ VALID (11 digits)
09301234567     ✅ VALID (11 digits)
09921234567     ✅ VALID (11 digits)
```

**Format: 09XXXXXXXXX**
- Starts with: **09**
- Total digits: **EXACTLY 11**
- NO other formats accepted!

---

## ❌ Invalid Phone Numbers (All Rejected)

### Too Short (10 digits)
```
0917123456      ❌ INVALID (10 digits)
0916123456      ❌ INVALID (10 digits)
0919123456      ❌ INVALID (10 digits)
```

### Too Long (12 or more digits)
```
091712345678    ❌ INVALID (12 digits)
639171234567    ❌ INVALID (12 digits - no longer accepted!)
+639171234567   ❌ INVALID (+63 format - no longer accepted!)
```

### Wrong Format
```
1234567890      ❌ Doesn't start with 09
9171234567      ❌ Missing leading 0
555-1234567     ❌ Contains dashes
(917) 123-4567  ❌ Contains special chars
+1234567890     ❌ Not Philippine format
```

---

## 🔄 Philippine Phone Number - 11 Digits Explained

### Format Breakdown
```
09 | 1 7 | 1 2 3 4 5 6 7
│  │  └─────────────────── 7 more digits
│  └───── Carrier code (2 digits: 16, 17, 19, 20, 21, 22, 23, 30, 36, 37, 41, 42, 45, 46, etc.)
└──────── Regional indicator + Mobile (09)

Total: 11 digits EXACTLY
```

### Common Philippine Carriers (09X)
```
0917 - Globe
0916 - Vodafone/Sun
0912 - Smart
0919 - Smart
0920 - Sun
0921 - Smart
0922 - Smart
0923 - Smart
0930 - Smart
0936 - Smart
0937 - Sun
0941 - Dito
```

---

## 🎯 Practical Examples

### Scenario 1: User enters valid email
```
Input: "john.doe@gmail.com"
↓
Email validation: ✅ VALID
↓
Result: ✅ ACCEPTED (valid email)
```

### Scenario 2: User enters valid 11-digit phone
```
Input: "09171234567"
↓
Phone validation: ✅ VALID (11 digits)
↓
Result: ✅ ACCEPTED (valid phone)
```

### Scenario 3: User enters 10-digit phone (REJECTED NOW)
```
Input: "0917123456"
↓
Phone validation: ❌ INVALID (only 10 digits)
↓
Result: ❌ REJECTED
Error: "Please enter a valid email or 11-digit Philippine 
        phone number (09XXXXXXXXX)."
```

### Scenario 4: User enters 12-digit phone (REJECTED NOW)
```
Input: "639171234567"
↓
Phone validation: ❌ INVALID (12 digits - old format)
↓
Result: ❌ REJECTED
Error: "Please enter a valid email or 11-digit Philippine 
        phone number (09XXXXXXXXX)."
```

### Scenario 5: User enters invalid contact
```
Input: "123456" or "john"
↓
Email validation: ❌ Not an email
↓
Phone validation: ❌ Not 11 digits
↓
Result: ❌ REJECTED
Error: "Please enter a valid email or 11-digit Philippine 
        phone number (09XXXXXXXXX)."
```

---

## 🛠️ Technical Implementation

### Validation Function
```javascript
export function validatePhoneNumber(phone) {
  // Philippine phone: ONLY 11 digits (09XXXXXXXXX)
  const cleanPhone = String(phone).trim().replace(/\D/g, "");
  
  // Check if it's EXACTLY 11 digits starting with 0
  if (cleanPhone.length === 11 && cleanPhone.startsWith("0")) {
    return true;
  }
  return false;
}
```

**Rules:**
- Must be EXACTLY 11 digits
- Must start with 0
- NO exceptions for other formats
- NO +63 format (12 digits) accepted
- NO 10-digit numbers

---

## ✨ User Experience

### Error Message (If Invalid)
```
❌ "Please enter a valid email or 11-digit Philippine 
     phone number (09XXXXXXXXX)."
```

### Field Highlighting
- Invalid contact field: Red border + error message
- Error persists until corrected

### Automatic Clearing
- Fixing the error clears the red highlight
- Form accepts submission when valid

---

## 📝 Tips for Users

### For Email
1. Use standard email format
2. Include @domain.extension
3. Examples: gmail.com, yahoo.com, company.ph

### For Philippine Phone - 11 DIGITS ONLY
1. Must start with 09
2. Must have EXACTLY 11 digits total
3. Format: 09XXXXXXXXX
4. Examples:
   - 09171234567 ✅
   - 09065432109 ✅
   - 09301111111 ✅

### Common Mistakes to Avoid
- ❌ Using only 10 digits (0917123456)
- ❌ Using 12 digits (639171234567)
- ❌ Using +63 format (+639171234567)
- ❌ Forgetting the leading 0
- ❌ Adding hyphens or spaces
- ❌ Using letters or special characters

---

## 🧪 Testing Your Contact Info

| Input | Email? | Phone? | 11 Digits? | Result |
|-------|--------|--------|------------|--------|
| user@gmail.com | ✅ | ❌ | - | ✅ Accept |
| 09171234567 | ❌ | ✅ | ✅ | ✅ Accept |
| john@test.ph | ✅ | ❌ | - | ✅ Accept |
| 0917123456 | ❌ | ❌ | ❌ (10) | ❌ Reject |
| 639171234567 | ❌ | ❌ | ❌ (12) | ❌ Reject |
| +639171234567 | ❌ | ❌ | ❌ (12) | ❌ Reject |
| john | ❌ | ❌ | ❌ | ❌ Reject |
| 123456789 | ❌ | ❌ | ❌ (9) | ❌ Reject |

---

## ✅ Summary

**ONLY 11-DIGIT PHONE NUMBERS ARE ACCEPTED**

| Format | Accepted? |
|--------|-----------|
| Email (user@example.com) | ✅ YES |
| 11-digit phone (09XXXXXXXXX) | ✅ YES |
| 10-digit phone | ❌ NO |
| 12-digit phone (639...) | ❌ NO |
| +63 format | ❌ NO |
| Any other | ❌ NO |

---

## 📞 Support

If validation fails:
1. Check the error message
2. For phone: Use EXACTLY 11 digits starting with 09
3. For email: Use standard email format
4. Ensure no extra spaces or special characters

---

**Happy posting! 🚀**
