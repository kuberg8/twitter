import { Field } from 'react-final-form';
import React from 'react';
import TextField from '@mui/material/TextField';
import style from './input.module.css';

export default function FieldComponent({
  name,
  label,
  autoFocus,
  type,
  autoComplete,
}) {
  return (
    <Field name={name || ''}>
      {({ input, meta }) => (
        <div>
          {/* <pre>{JSON.stringify(meta, null, 4)}</pre> */}
          <TextField
            {...input}
            type={type}
            margin="none"
            // required={required}
            fullWidth
            autoFocus={autoFocus}
            autoComplete={autoComplete}
            label={label}
            error={!meta.valid && meta.touched}
          />

          {!meta.valid && meta.touched && (
            <span className={style.error}>
              {meta.error /*|| meta.submitError*/}
            </span>
          )}
        </div>
      )}
    </Field>
  );
}
