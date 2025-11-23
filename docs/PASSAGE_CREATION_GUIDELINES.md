# Reading Passage Creation Guidelines

## Overview

This document provides comprehensive guidelines for creating, editing, and maintaining reading passages for the English learning platform. All passages must meet these standards before publication.

---

## 1. File Structure and Organization

### Directory Structure
```
public/data/
├── passages/           # Final published passages (.txt format)
├── passage-sources/    # Source files and drafts
├── vocabulary/         # Vocabulary CSV files
└── dictionaries/       # JSON dictionaries for passages
```

### File Naming Convention
- Format: `{level}-{topic-slug}.txt`
- Levels: `beginner`, `intermediate`, `advanced`
- Examples:
  - `beginner-supermarket-shopping.txt`
  - `intermediate-hospital-visit.txt`
  - `advanced-environmental-issues.txt`

### File Count by Level
- **Beginner**: 5 passages minimum
- **Intermediate**: 8 passages minimum
- **Advanced**: 8 passages minimum
- **Total**: 21 passages minimum

---

## 2. Content Guidelines

### Length Requirements
- **Beginner**: 800-1,500 words
- **Intermediate**: 1,500-2,500 words
- **Advanced**: 2,500-4,000 words

### Topic Selection
Topics should be:
- Educationally valuable for Japanese middle school students
- Age-appropriate and culturally sensitive
- Diverse across different themes (daily life, culture, science, history, etc.)
- Relevant to vocabulary learning objectives

### Existing Topics (Reference)
**Beginner:**
- Supermarket shopping
- Café menu
- Daily conversations
- Weather and seasons
- Wildlife park guide

**Intermediate:**
- Career day
- Community events
- Exchange student experiences
- Homestay experiences
- Hospital visit
- School events
- School news
- Science museum

**Advanced:**
- Environmental issues
- Family gatherings
- Health statistics
- Historical figures
- International exchange
- School festival
- Summer vacation stories
- Technology and future

---

## 3. Formatting Standards

### Paragraph Indentation
**CRITICAL REQUIREMENT:**
- First line of each paragraph MUST be indented with 4 spaces
- Do NOT indent continuation lines
- Section headers are NOT indented

```
Example:

Section Header

    This is the first line of a paragraph with proper 4-space indentation.
This is the second line with no indentation.
This is the third line with no indentation.

    This is a new paragraph, starting with 4-space indentation again.
The rest of the paragraph continues without indentation.
```

### Section Headers
- Title case capitalization
- No period at the end
- Empty line before and after
- Not indented

```
Example:

Daily Life at School

    First paragraph starts here...
```

### Dialogue Formatting
- Use standard quotation marks: "Hello"
- Dialogue tags after closing quote use comma inside quotes
- Each speaker on a new line
- Speaker labels when needed: `Mom:`, `Student:`, etc.

```
Example:

Mom: "Good morning! Time to wake up."

Me: "Good morning, Mom. What time is it?"

Mom: "It's seven o'clock," she replied.
```

---

## 4. Grammar and Style Requirements

### Punctuation
- **Em dashes**: Use `—` (em dash), not `-` (hyphen) or `--`
  - Correct: `word—word`
  - Incorrect: `word - word` or `word--word`
  
- **Commas**: Use Oxford comma in lists
  - Correct: `apples, oranges, and bananas`
  
- **Periods**: All sentences must end with proper punctuation
  
- **Dialogue**: Comma before closing quote when dialogue tag follows
  - Correct: `"Hello," she said.`
  - Incorrect: `"Hello." she said.`

### Grammar Rules
1. **Subject-verb agreement**: Always verify
2. **Verb tense consistency**: Maintain consistent tense within sections
3. **Articles (a/an/the)**:
   - Use "an" before vowel sounds: `an apple`, `an hour`
   - Use "a" before consonant sounds: `a university`, `a European`
4. **Countable vs uncountable nouns**:
   - Use "number of" with countable: `number of deaths`, `number of people`
   - Use "amount of" with uncountable: `amount of water`, `amount of money`

### Style Guidelines
- **Natural English**: Write as native speakers would
- **Educational tone**: Professional but accessible
- **Clarity**: Prefer clear, straightforward expression
- **Variety**: Vary sentence structure and length
- **Transitions**: Use appropriate transition words between paragraphs

---

## 5. Vocabulary Integration Requirements

### Coverage Goals
- **Target overall coverage**: 90%+ of all-words.csv (3,281 words)
- **Current coverage**: 63.06% (as of 2025-11-23)
- Each passage should integrate unused vocabulary naturally

### Vocabulary Integration Principles
1. **Natural integration**: Words must fit context authentically
2. **Educational value**: Vocabulary should be useful for students
3. **Thematic coherence**: Related words grouped by topic
4. **Progressive difficulty**: Match vocabulary to passage level
5. **No forced vocabulary**: Never sacrifice natural English for coverage

### Checking Coverage
Run vocabulary coverage report:
```bash
cd scripts
python3 vocab_coverage_report.py --vocab ../public/data/vocabulary/all-words.csv
```

Expected output format:
```
Overall coverage: XX.XX%
Words used: XXXX/3281
Words unused: XXXX
```

### Expanding for Coverage
When expanding passages to improve coverage:
1. Identify thematically appropriate unused words
2. Create natural sections that incorporate these words
3. Maintain narrative flow and educational quality
4. Insert before conclusion sections
5. Verify coverage improvement after each batch

**Coverage Expansion Strategies:**
- Add contextual detail sections
- Expand on implications and analysis
- Include real-world examples
- Discuss related concepts
- Add historical or cultural context

---

## 6. Quality Assurance Checklist

Before finalizing any passage, verify:

### Content Quality
- [ ] Topic is age-appropriate and educational
- [ ] Length meets level requirements
- [ ] Information is accurate and up-to-date
- [ ] Cultural sensitivity maintained
- [ ] Educational value is clear

### Formatting
- [ ] All paragraphs have 4-space first-line indentation
- [ ] Section headers properly formatted
- [ ] No double spaces (except paragraph indent)
- [ ] Consistent line breaks between sections
- [ ] Dialogue formatted correctly

### Grammar & Style
- [ ] No spelling errors
- [ ] Subject-verb agreement verified
- [ ] Verb tense consistency maintained
- [ ] Article usage (a/an/the) correct
- [ ] Countable/uncountable noun usage correct
- [ ] Em dashes used instead of single dashes
- [ ] All sentences end with proper punctuation
- [ ] Natural, native-level English throughout

### Vocabulary
- [ ] Vocabulary coverage improved (if expansion)
- [ ] Words integrated naturally
- [ ] No forced or awkward vocabulary usage
- [ ] Appropriate difficulty for level

---

## 7. Automated Quality Check Scripts

### Paragraph Indentation Checker
```python
def check_indentation(filename):
    """Verify all paragraphs have proper 4-space indentation"""
    with open(filename, 'r') as f:
        lines = f.readlines()
    
    issues = []
    for i, line in enumerate(lines, 1):
        stripped = line.strip()
        if not stripped:
            continue
        
        # Check if paragraph start (after empty line)
        prev_empty = i == 1 or not lines[i-2].strip()
        if prev_empty and stripped and not line.startswith('    '):
            # Check if it's a header (no period at end, title case)
            if not is_header(stripped):
                issues.append(f"Line {i}: Missing indent")
    
    return issues
```

### Grammar Checker
```python
def check_grammar(content):
    """Check common grammar issues"""
    issues = []
    
    # Check amount vs number
    if 'amount of deaths' in content.lower():
        issues.append("Use 'number of deaths', not 'amount'")
    if 'amount of people' in content.lower():
        issues.append("Use 'number of people', not 'amount'")
    
    # Check a/an usage
    import re
    wrong_a = re.findall(r'\ba ([aeiou]\w+)', content, re.I)
    for word in wrong_a:
        if word.lower() not in ['university', 'european', 'uniform']:
            issues.append(f"Use 'an {word}', not 'a {word}'")
    
    return issues
```

### Dash Fixer
```python
def fix_dashes(content):
    """Convert single dashes to em dashes"""
    import re
    # Replace spaced dash with em dash
    content = re.sub(r'(\w+) - (\w+)', r'\1—\2', content)
    return content
```

---

## 8. Workflow for New Passages

### Step 1: Planning
1. Select topic appropriate for target level
2. Research content for accuracy
3. Identify target vocabulary to integrate
4. Outline main sections

### Step 2: Drafting
1. Write initial draft in plain text
2. Focus on content quality and natural English
3. Aim for target word count
4. Include vocabulary naturally

### Step 3: Formatting
1. Add section headers
2. Apply 4-space paragraph indentation
3. Format dialogue correctly
4. Fix em dashes

### Step 4: Grammar & Style Review
1. Check subject-verb agreement
2. Verify tense consistency
3. Review article usage (a/an/the)
4. Check countable/uncountable nouns
5. Verify punctuation

### Step 5: Vocabulary Check
1. Run coverage report
2. Identify integration opportunities
3. Add natural expansions if needed
4. Re-check coverage

### Step 6: Quality Assurance
1. Run automated checks
2. Read aloud for naturalness
3. Verify educational value
4. Check against all guidelines

### Step 7: Publication
1. Save to `public/data/passages/`
2. Update related dictionaries if needed
3. Commit with descriptive message
4. Push to GitHub

---

## 9. Vocabulary Coverage Strategy

### Current Status (2025-11-23)
- Total vocabulary: 3,281 words (all-words.csv)
- Current coverage: 63.06% (2,068 words)
- Remaining: 1,213 words
- Target: 90%+ coverage

### Achieving High Coverage

**Phase 1: New Passage Creation (COMPLETED)**
- Created 8 new passages with target vocabulary
- Result: 46.21% → 57.82%

**Phase 2: Systematic Expansion (COMPLETED)**
- Expanded 18 of 21 passages with thematic sections
- Result: 57.82% → 63.06%

**Phase 3: Targeted Integration (FUTURE)**
- Identify remaining high-value vocabulary
- Create specialized mini-passages or expand existing ones
- Focus on naturally integrable words
- Target: 70%+ coverage

**Phase 4: Optimization (FUTURE)**
- Review remaining unused vocabulary
- Assess pedagogical value
- Create targeted content for integrable words
- Document non-integrable vocabulary with rationale
- Target: 80-90% coverage

### Vocabulary Categories to Prioritize
1. **High-frequency academic words**: Essential for student learning
2. **Thematically clustered words**: Easier to integrate naturally
3. **Common collocations**: Natural in context
4. **Cross-topic vocabulary**: Versatile usage

### Words Difficult to Integrate Naturally
- Highly specialized technical terms (biochemistry, nanotechnology)
- Archaic or literary terms (blasphemy, thou)
- Military-specific vocabulary (armory, artillery)
- Legal jargon (statute, litigation)
- Medical terminology (diagnosis, symptom) - unless medical passage

**Note**: Document these with explanation for why 100% coverage may not be pedagogically optimal.

---

## 10. Git Commit Message Standards

### Format
```
<type>: <short description>

<detailed description>
- Bullet points for specific changes
- Coverage metrics if applicable
- Quality assurance notes

<optional footer>
```

### Types
- `feat`: New passage created
- `edit`: Grammar/style improvements
- `expand`: Vocabulary coverage expansion
- `fix`: Bug fixes or corrections
- `docs`: Documentation updates
- `style`: Formatting changes only

### Examples

**New Passage:**
```
feat: Add intermediate-career-day passage

Created comprehensive career exploration passage for intermediate level.
- Word count: 1,842 words
- Integrated 45 target vocabulary words
- Topics: various career paths, work-life balance, education requirements
- Coverage contribution: +0.8%

Quality checks: ✓ Grammar ✓ Formatting ✓ Indentation
```

**Expansion:**
```
expand: Improve vocabulary coverage (61.75% → 63.06%)

Expanded 7 passages with thematic content sections:
- beginner-weather-seasons: weather forecasting, climate change
- intermediate-career-day: work-life balance, career transitions
- advanced-summer-vacation: cultural adaptation, personal growth
- intermediate-hospital-visit: healthcare systems, patient rights
- intermediate-science-museum: environmental science, STEM careers
- advanced-historical-figures: historiography, historical interpretation
- advanced-technology-future: quantum computing, nanotechnology

Total: +43 words covered, +1.31 percentage points
```

**Editorial Review:**
```
edit: Professional editorial review of all passages

All 21 passages reviewed and corrected:
- Fixed paragraph indentation (4-space standard)
- Converted dashes to em dashes
- Corrected countable noun usage (amount → number)
- Verified article usage (a/an/the)
- Confirmed dialogue punctuation

Status: All passages publication-ready
```

---

## 11. Maintenance and Updates

### Regular Reviews
- **Monthly**: Check for outdated information
- **Quarterly**: Review vocabulary coverage progress
- **Annually**: Comprehensive content audit

### Version Control
- Keep passage-sources/ for original drafts
- Use clear commit messages
- Tag major releases
- Document significant changes

### Continuous Improvement
- Collect student feedback
- Monitor vocabulary acquisition data
- Update based on curriculum changes
- Refine based on usage analytics

---

## 12. Quick Reference Checklist

When creating or editing passages, use this quick checklist:

```
□ Proper file naming: {level}-{topic}.txt
□ Appropriate word count for level
□ All paragraphs indented with 4 spaces
□ Section headers not indented, no end period
□ Em dashes (—) instead of hyphens (-)
□ Correct a/an usage
□ "Number of" for countable, "amount of" for uncountable
□ Dialogue punctuation correct
□ Consistent verb tense
□ Subject-verb agreement
□ Natural, native-level English
□ Educational value clear
□ Vocabulary integrated naturally
□ Coverage report run and verified
□ All quality checks passed
□ Descriptive commit message
```

---

## 13. Tools and Resources

### Required Tools
- Python 3.x (for coverage scripts)
- Text editor with UTF-8 support
- Git for version control

### Useful Scripts Location
```
scripts/
├── vocab_coverage_report.py      # Main coverage checker
├── vocab_coverage_lemma.py       # Lemma-based checking
├── phrase_coverage_report.py     # Phrase coverage
└── passage_validator.py          # Validation tool
```

### Running Coverage Report
```bash
cd scripts
python3 vocab_coverage_report.py --vocab ../public/data/vocabulary/all-words.csv
```

### Vocabulary Files
```
public/data/vocabulary/
├── all-words.csv                 # Master vocabulary (3,281 words)
├── junior-high-entrance-words.csv
├── intermediate-1800-words.csv
└── intermediate-1800-phrases.csv
```

---

## 14. Contact and Support

### Documentation Updates
This document should be updated whenever:
- New standards are established
- Processes are refined
- Tools are added or changed
- Coverage targets are adjusted

### Questions or Issues
- Document unclear guidelines as you encounter them
- Propose improvements to workflow
- Share successful techniques

---

## Appendix A: Complete Grammar Rules Reference

### Articles
- **Definite (the)**: Specific, known items
- **Indefinite (a/an)**: Non-specific, first mention
- **No article**: Plurals, uncountables, generalizations

### Countable vs Uncountable
**Use "number of" with countable:**
- number of people
- number of deaths
- number of cars
- number of books

**Use "amount of" with uncountable:**
- amount of water
- amount of money
- amount of time
- amount of information

### Verb Tenses
- **Simple present**: Habitual actions, facts
- **Present continuous**: Current actions
- **Simple past**: Completed past actions
- **Past continuous**: Ongoing past actions
- **Present perfect**: Past actions with present relevance
- **Future**: Will/going to for future events

### Common Errors to Avoid
1. It's vs its (it's = it is)
2. Their vs there vs they're
3. Your vs you're (you're = you are)
4. Affect vs effect (affect = verb, effect = noun usually)
5. Then vs than (then = time, than = comparison)

---

## Appendix B: Sample Passage Analysis

### Example: beginner-supermarket-shopping.txt
**Level**: Beginner
**Word count**: ~3,200 words (expanded)
**Topic**: Daily life, shopping
**Structure**: 
- Introduction
- Sequential shopping sections (produce, meat, bakery, etc.)
- Special situations
- Learning outcomes
- Reflection

**Vocabulary coverage contribution**: ~120 words
**Notable features**:
- Clear narrative flow
- Age-appropriate scenarios
- Natural vocabulary integration
- Progressive complexity within beginner level

**Quality metrics**:
- ✓ Proper indentation
- ✓ Native-level English
- ✓ Educational value
- ✓ Cultural appropriateness

---

*Last updated: 2025-11-23*
*Version: 1.0*
*Status: Active*
