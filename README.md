# Easy Query Knowledge Base Solution

A comprehensive knowledge management system with AI-powered querying, business rules management, and user configuration.

## Features

- **AI-Powered Querying**: Intelligent database querying with business rules validation
- **Business Rules Management**: Centralized business logic management
- **User Configuration**: Persistent local storage for faster loading
- **Database Management**: Multi-database support with MSSQL integration
- **Company Hierarchy**: Organizational structure management
- **File Processing**: Excel to database conversion and file-based queries

## Local Storage Configuration

The application now includes local storage functionality to improve performance and reduce API calls:

### User Configuration Storage

- **Automatic Saving**: Configuration is automatically saved to localStorage when:
  - Databases are loaded from backend
  - Current database is changed
  - Business rules are updated
  - User manually saves configuration

- **Smart Loading**: The app prioritizes local storage:
  1. First attempts to load from localStorage
  2. Falls back to backend API if no local data exists
  3. Automatically syncs local and remote data

- **Data Persistence**: Stored configuration includes:
  - Available databases list
  - Current database selection
  - Business rules content
  - Last updated timestamp
  - Configuration version

### Storage Service

The `UserConfigStorageService` provides:

```typescript
// Save complete configuration
UserConfigStorageService.saveUserConfiguration(
  userId, 
  databases, 
  currentDatabaseId, 
  currentDatabaseName, 
  businessRules
);

// Load configuration
const config = UserConfigStorageService.loadUserConfiguration(userId);

// Update specific parts
UserConfigStorageService.updateCurrentDatabase(userId, dbId, dbName);
UserConfigStorageService.updateBusinessRules(userId, rules);
```

### Context Integration

- **DatabaseContextProvider**: Integrates with local storage for database configuration
- **BusinessRulesContextProvider**: Fetches business rules fresh from server (no localStorage caching)
  - **Automatic Sync**: Database changes trigger fresh business rules fetch
  - **State Management**: Tracks business rules state and validation
  - **Performance**: Always uses current database-specific business rules

### Configuration Status

The user configuration page shows:

- **Local Storage Status**: Whether configuration is saved locally
- **Unsaved Changes**: Visual indicators for pending changes
- **Save Button**: Manual save option for immediate persistence
- **Auto-save**: Automatic saving after major operations

## Getting Started

1. **Install Dependencies**:
   ```bash
   pnpm install
   ```

2. **Run Development Server**:
   ```bash
   pnpm dev
   ```

3. **Access Application**:
   - Navigate to `http://localhost:3000`
   - Authenticate with your credentials
   - Configure your database settings
   - Business rules will be automatically saved locally

## Architecture

- **Frontend**: Next.js with TypeScript
- **State Management**: React Context with local storage persistence
- **UI Components**: Custom components with Tailwind CSS
- **API Integration**: Service registry pattern with standardized services
- **Storage**: Browser localStorage with automatic validation and cleanup

## Benefits of Local Storage

1. **Faster Loading**: No need to fetch configuration on every page load
2. **Reduced API Calls**: Minimizes backend requests for configuration data
3. **Offline Capability**: Basic functionality works without network connection
4. **Better UX**: Immediate access to user preferences and settings
5. **Performance**: Improved app responsiveness and reduced loading times

## Configuration Management

### Manual Save
Users can manually save their configuration using the "Save Configuration" button, which:
- Saves current database selection
- Persists business rules
- Updates local storage timestamp
- Provides visual feedback

### Automatic Sync
The system automatically syncs data when:
- Switching between databases
- Updating business rules
- Loading new configuration from backend
- Refreshing data

### Data Validation
Local storage includes validation to ensure:
- Configuration structure integrity
- Data freshness (24-hour expiration)
- User ID consistency
- Required field presence

## Troubleshooting

### Clear Local Configuration
If you encounter issues with local storage:
1. Open browser developer tools
2. Go to Application > Local Storage
3. Clear entries starting with `user_config_`
4. Refresh the page to reload from backend

### Force Refresh
Use the "Refresh" button to force reload from backend and update local storage.

### Configuration Reset
The system automatically resets corrupted or expired configurations.
