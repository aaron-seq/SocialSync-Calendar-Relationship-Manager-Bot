# Automation Policy: Auto-Send vs Review Logic

This document describes the hierarchical decision tree that determines whether a message requires human approval or can be auto-sent.

## The Safety Check Algorithm

When the cron job generates a draft for an upcoming event, the system evaluates three levels in order:

```
┌─────────────────────────────────────────────────────────────┐
│                    DECISION HIERARCHY                        │
├─────────────────────────────────────────────────────────────┤
│  Level 1: Event Override       ← Highest Priority           │
│  Level 2: Contact Default      ← If Event = USE_DEFAULT     │
│  Level 3: Significance Level   ← If Contact = LOW_RISK      │
└─────────────────────────────────────────────────────────────┘
```

---

## Level 1: Check `automation_override` on Event

| Value | Result | Proceeds? |
|-------|--------|-----------|
| `FORCE_REVIEW` | Status = `WAITING_FOR_REVIEW` | ❌ Final |
| `FORCE_AUTO` | Status = `APPROVED_WAITING` | ❌ Final |
| `USE_CONTACT_DEFAULT` | Continue to Level 2 | ✅ Yes |

---

## Level 2: Check `default_auto_policy` on Contact

| Value | Result | Proceeds? |
|-------|--------|-----------|
| `ALWAYS_REVIEW` | Status = `WAITING_FOR_REVIEW` | ❌ Final |
| `ALWAYS_AUTO_SEND` | Status = `APPROVED_WAITING` | ❌ Final |
| `AUTO_SEND_LOW_RISK` | Continue to Level 3 | ✅ Yes |

---

## Level 3: Check `significance_level` on Event

| Value | Result | Reasoning |
|-------|--------|-----------|
| `HIGH` | Status = `WAITING_FOR_REVIEW` | Too risky to botch |
| `MEDIUM` | Status = `APPROVED_WAITING` | Safe enough |
| `LOW` | Status = `APPROVED_WAITING` | Very safe |

---

## Implementation (Python Pseudocode)

```python
def determine_message_status(event: Event, contact: Contact) -> str:
    """
    Determine if a message requires review or can be auto-sent.
    Returns: 'WAITING_FOR_REVIEW' or 'APPROVED_WAITING'
    """
    
    # Level 1: Event Override
    if event.automation_override == 'FORCE_REVIEW':
        return 'WAITING_FOR_REVIEW'
    if event.automation_override == 'FORCE_AUTO':
        return 'APPROVED_WAITING'
    
    # Level 2: Contact Default (only if USE_CONTACT_DEFAULT)
    if contact.default_auto_policy == 'ALWAYS_REVIEW':
        return 'WAITING_FOR_REVIEW'
    if contact.default_auto_policy == 'ALWAYS_AUTO_SEND':
        return 'APPROVED_WAITING'
    
    # Level 3: Significance (only if AUTO_SEND_LOW_RISK)
    if event.significance_level == 'HIGH':
        return 'WAITING_FOR_REVIEW'
    
    return 'APPROVED_WAITING'
```

---

## Example Scenarios

### Scenario 1: Best Friend's Birthday
- **Contact**: Riya | `default_auto_policy = AUTO_SEND_LOW_RISK`
- **Event**: Birthday | `significance_level = MEDIUM` | `automation_override = USE_CONTACT_DEFAULT`

**Flow**: 
1. Event override = `USE_CONTACT_DEFAULT` → Continue
2. Contact policy = `AUTO_SEND_LOW_RISK` → Continue  
3. Significance = `MEDIUM` → **AUTO-SEND** ✅

---

### Scenario 2: Best Friend's Promotion
- **Contact**: Riya | `default_auto_policy = AUTO_SEND_LOW_RISK`
- **Event**: Promotion | `significance_level = HIGH` | `automation_override = USE_CONTACT_DEFAULT`

**Flow**:
1. Event override = `USE_CONTACT_DEFAULT` → Continue
2. Contact policy = `AUTO_SEND_LOW_RISK` → Continue
3. Significance = `HIGH` → **REVIEW REQUIRED** 🔍

---

### Scenario 3: Boss's Birthday (Always Review)
- **Contact**: Michael | `default_auto_policy = ALWAYS_REVIEW`
- **Event**: Birthday | `significance_level = MEDIUM`

**Flow**:
1. Event override = `USE_CONTACT_DEFAULT` → Continue
2. Contact policy = `ALWAYS_REVIEW` → **REVIEW REQUIRED** 🔍

---

### Scenario 4: Wife's Anniversary (Force Auto)
- **Contact**: Sarah | `default_auto_policy = ALWAYS_AUTO_SEND`
- **Event**: Anniversary | `automation_override = USE_CONTACT_DEFAULT`

**Flow**:
1. Event override = `USE_CONTACT_DEFAULT` → Continue
2. Contact policy = `ALWAYS_AUTO_SEND` → **AUTO-SEND** ✅

---

### Scenario 5: Wife's Career Change (Override)
- **Contact**: Sarah | `default_auto_policy = ALWAYS_AUTO_SEND`
- **Event**: New Job | `automation_override = FORCE_REVIEW`

**Flow**:
1. Event override = `FORCE_REVIEW` → **REVIEW REQUIRED** 🔍
   *(Overrides contact's "always auto" setting)*

---

## Database SQL for Policy Check

```sql
-- Function to determine message status
create or replace function determine_automation_status(
  p_event_id uuid
) returns text as $$
declare
  v_event events%rowtype;
  v_contact contacts%rowtype;
begin
  -- Fetch event and contact
  select * into v_event from events where id = p_event_id;
  select * into v_contact from contacts where id = v_event.contact_id;
  
  -- Level 1: Event Override
  if v_event.automation_override = 'FORCE_REVIEW' then
    return 'WAITING_FOR_REVIEW';
  elsif v_event.automation_override = 'FORCE_AUTO' then
    return 'APPROVED_WAITING';
  end if;
  
  -- Level 2: Contact Default
  if v_contact.default_auto_policy = 'ALWAYS_REVIEW' then
    return 'WAITING_FOR_REVIEW';
  elsif v_contact.default_auto_policy = 'ALWAYS_AUTO_SEND' then
    return 'APPROVED_WAITING';
  end if;
  
  -- Level 3: Significance Level (AUTO_SEND_LOW_RISK)
  if v_event.significance_level = 'HIGH' then
    return 'WAITING_FOR_REVIEW';
  end if;
  
  return 'APPROVED_WAITING';
end;
$$ language plpgsql;
```
