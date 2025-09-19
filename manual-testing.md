# Manual Testing Checklist: Tunisafka Food Menu App

**Purpose**: Manual validation of all functional requirements and user experience  
**Prerequisites**: Backend and frontend servers running, application accessible in browser  
**Duration**: ~10-15 minutes  

## Pre-Testing Setup
- [ ] Backend server running on http://localhost:3001
- [ ] Frontend application running on http://localhost:3000
- [ ] Browser developer tools open for monitoring
- [ ] Network connectivity to https://unisafka.fi/tty/ verified

## Test Scenario 1: Initial Menu Loading
**Validates**: FR-001, FR-002, FR-007, FR-008

### Steps:
1. [ ] Open fresh browser tab to http://localhost:3000
2. [ ] Observe loading state immediately after page load
3. [ ] Wait for menu data to appear
4. [ ] Check browser console for JavaScript errors
5. [ ] Verify menu data structure and content

### Expected Results:
- [ ] Loading spinner/indicator appears during initial load
- [ ] Menu data loads within 3 seconds
- [ ] All menus displayed in clear, readable format
- [ ] Each menu shows title, description, and items list
- [ ] Menu items display name, description, price, dietary info
- [ ] No JavaScript errors in console
- [ ] Timestamps show recent scraping time

### Performance Check:
- [ ] Record actual loading time: ______ seconds (should be <3s)
- [ ] Memory usage reasonable (check browser task manager)

## Test Scenario 2: Random Menu Selection
**Validates**: FR-003, FR-004, FR-005, FR-009

### Steps:
1. [ ] Locate "Select Random Menu" button
2. [ ] Click the button and observe response
3. [ ] Note which menu was selected
4. [ ] Click button 5 more times, recording selections
5. [ ] Verify visual feedback for each selection

### Expected Results:
- [ ] Button is clearly visible and accessible
- [ ] Click triggers immediate response (<1s)
- [ ] Selected menu is visually highlighted/emphasized
- [ ] Visual feedback is clear and unambiguous
- [ ] Multiple clicks show different random selections
- [ ] Application remains responsive throughout

### Randomness Verification:
- [ ] Selection 1: ________________
- [ ] Selection 2: ________________  
- [ ] Selection 3: ________________
- [ ] Selection 4: ________________
- [ ] Selection 5: ________________
- [ ] Selections appear random (not following pattern)

### Performance Check:
- [ ] Record selection response time: ______ ms (should be <1s)

## Test Scenario 3: Data Refresh
**Validates**: FR-007, FR-008

### Steps:
1. [ ] Note current menu data and timestamp
2. [ ] Trigger manual refresh (if refresh button exists)
3. [ ] Observe refresh process and loading states
4. [ ] Compare before/after timestamps

### Expected Results:
- [ ] Loading state appears during refresh
- [ ] New timestamp reflects fresh scraping
- [ ] Menu data updates appropriately
- [ ] User feedback during refresh process

## Test Scenario 4: Error Handling - Network Issues
**Validates**: FR-006, FR-008

### Steps:
1. [ ] Block network access (browser dev tools → Network tab → Go offline)
2. [ ] Attempt to refresh or reload application
3. [ ] Observe error handling behavior
4. [ ] Re-enable network and retry

### Expected Results:
- [ ] User-friendly error message appears
- [ ] No application crash or white screen
- [ ] Error message explains the issue clearly
- [ ] Recovery mechanism available (retry button/manual refresh)
- [ ] Application recovers when network restored

## Test Scenario 5: Empty Menu Handling
**Validates**: FR-006, FR-008

### Steps:
1. [ ] Simulate scenario with no available menus (if possible via dev tools)
2. [ ] Attempt random selection with empty state
3. [ ] Observe application behavior

### Expected Results:
- [ ] Clear message indicating no menus available
- [ ] Random selection button disabled or shows appropriate state
- [ ] No JavaScript errors or broken functionality
- [ ] User understands current application state

## Test Scenario 6: Single Menu Edge Case
**Validates**: FR-004, FR-005

### Steps:
1. [ ] If multiple menus available, temporarily hide all but one (dev tools)
2. [ ] Click "Select Random Menu" button
3. [ ] Observe selection behavior with single option

### Expected Results:
- [ ] Single menu selected without errors
- [ ] Visual feedback still works correctly
- [ ] No JavaScript errors with edge case
- [ ] Button remains functional

## Browser Compatibility Testing
**Validates**: FR-009

### Chrome Testing:
- [ ] Complete Scenarios 1-2 in Chrome
- [ ] Visual layout renders correctly
- [ ] All interactions work as expected
- [ ] No console errors specific to Chrome

### Firefox Testing:
- [ ] Complete Scenarios 1-2 in Firefox
- [ ] Visual layout renders correctly
- [ ] All interactions work as expected
- [ ] No console errors specific to Firefox

### Safari Testing (if available):
- [ ] Complete Scenarios 1-2 in Safari
- [ ] Visual layout renders correctly
- [ ] All interactions work as expected
- [ ] No console errors specific to Safari

### Edge Testing (if available):
- [ ] Complete Scenarios 1-2 in Edge
- [ ] Visual layout renders correctly
- [ ] All interactions work as expected
- [ ] No console errors specific to Edge

## Performance Validation

### Loading Performance:
- [ ] Initial page load: ______ seconds (goal: <2s)
- [ ] Menu data fetch: ______ seconds (goal: <3s)
- [ ] Random selection: ______ ms (goal: <1s)

### Usability Check:
- [ ] Interface is intuitive without instructions
- [ ] Button labels are clear and actionable
- [ ] Loading states provide appropriate feedback
- [ ] Error messages are helpful and actionable
- [ ] Visual hierarchy guides user attention appropriately

## API Validation (Dev Tools Network Tab)

### Menu Loading Request:
- [ ] GET /api/menus returns 200 status
- [ ] Response matches API contract schema
- [ ] Content-Type: application/json
- [ ] Response time reasonable (<3s)

### Random Selection Request:
- [ ] GET /api/menus/random returns 200 status
- [ ] Response matches API contract schema
- [ ] Selected menu included in response
- [ ] Response time reasonable (<1s)

### Error Response Validation:
- [ ] Network errors return appropriate HTTP status codes
- [ ] Error responses include proper error codes and messages
- [ ] CORS headers present for cross-origin requests

## Accessibility Quick Check

### Keyboard Navigation:
- [ ] Can navigate to random button using Tab key
- [ ] Can activate button using Enter or Space
- [ ] Focus indicators visible and clear

### Screen Reader Simulation:
- [ ] Button has descriptive label/aria-label
- [ ] Menu content has appropriate heading structure
- [ ] Error messages are announced properly

## Final Validation

### Functional Requirements Complete:
- [ ] FR-001: Menu scraping and display ✓
- [ ] FR-002: Clear, readable format ✓
- [ ] FR-003: Visible random selection button ✓
- [ ] FR-004: Random menu selection works ✓
- [ ] FR-005: Visual selection indication ✓
- [ ] FR-006: Error handling graceful ✓
- [ ] FR-007: Real-time data refresh ✓
- [ ] FR-008: Loading states and error messages ✓
- [ ] FR-009: Browser compatibility ✓

### Performance Goals Met:
- [ ] Menu loading <3 seconds ✓
- [ ] Random selection <1 second ✓
- [ ] Real-time updates working ✓

### User Experience Quality:
- [ ] Interface intuitive and easy to use ✓
- [ ] Visual feedback clear and immediate ✓
- [ ] Error handling maintains user confidence ✓
- [ ] No broken functionality discovered ✓

## Issues Found
_Document any problems discovered during manual testing:_

**Issue 1**: _____________________________________________________  
**Severity**: High/Medium/Low  
**Steps to Reproduce**: ________________________________________  
**Expected**: ________________________________________________  
**Actual**: __________________________________________________  

**Issue 2**: _____________________________________________________  
**Severity**: High/Medium/Low  
**Steps to Reproduce**: ________________________________________  
**Expected**: ________________________________________________  
**Actual**: __________________________________________________  

## Testing Complete
- [ ] All scenarios completed successfully
- [ ] No critical issues found
- [ ] Performance goals achieved
- [ ] Ready for production deployment

**Tester Name**: ________________________  
**Date**: ______________________________  
**Total Testing Time**: _________________
