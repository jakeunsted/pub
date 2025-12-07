import { useState } from 'react';
import { Alert, StyleSheet, View } from 'react-native';

import { Button, ButtonText } from '@/components/ui/button';
import {
  FormControl,
  FormControlLabel,
  FormControlLabelText,
} from '@/components/ui/form-control';
import { Input, InputField } from '@/components/ui/input';

interface CreateGroupFormProps {
  onSubmit: (name: string) => Promise<void>;
  onCancel: () => void;
  isSubmitting?: boolean;
}

export function CreateGroupForm({ onSubmit, onCancel, isSubmitting = false }: CreateGroupFormProps) {
  const [groupName, setGroupName] = useState('');

  const handleSubmit = async () => {
    if (!groupName.trim()) {
      Alert.alert('Error', 'Please enter a group name');
      return;
    }
    try {
      await onSubmit(groupName.trim());
      // Clear the form only on successful submission
      // The parent will close the form on success
      setGroupName('');
    } catch (error) {
      // Keep the form name if there's an error so user can retry
      // Error is already handled by the parent component
    }
  };

  return (
    <View style={styles.createForm}>
      <FormControl style={styles.formControl}>
        <FormControlLabel>
          <FormControlLabelText>Group name</FormControlLabelText>
        </FormControlLabel>
        <Input>
          <InputField
            placeholder="Enter group name"
            value={groupName}
            onChangeText={setGroupName}
            autoFocus
          />
        </Input>
      </FormControl>

      <View style={styles.formButtons}>
        <Button
          style={styles.button}
          onPress={handleSubmit}
          isDisabled={isSubmitting}
          size="lg"
          action="primary"
        >
          <ButtonText>{isSubmitting ? 'Creating...' : 'Create'}</ButtonText>
        </Button>
        <Button
          style={styles.button}
          onPress={() => {
            setGroupName('');
            onCancel();
          }}
          size="lg"
          variant="outline"
          action="secondary"
        >
          <ButtonText>Cancel</ButtonText>
        </Button>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  createForm: {
    marginTop: 20,
  },
  formControl: {
    marginBottom: 20,
  },
  formButtons: {
    flexDirection: 'row',
    gap: 10,
  },
  button: {
    flex: 1,
  },
});
