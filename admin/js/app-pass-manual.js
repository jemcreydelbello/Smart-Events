/*App Password Manual Modal*/

document.addEventListener('DOMContentLoaded', function() {
    if (!document.getElementById('appPasswordGuideModal')) {
        const modalHTML = `
            <!-- App Password Guide Modal -->
            <div id="appPasswordGuideModal" class="modal" onclick="if(event.target.id === 'appPasswordGuideModal') closeAppPasswordGuideModal();">
                <div class="modal-content" onclick="event.stopPropagation();" style="max-width: 600px; width: 90%; max-height: 80vh; overflow-y: auto; background: white; border-radius: 12px; box-shadow: 0 20px 60px rgba(0,0,0,0.3); padding: 0;">
                    <!-- Header Section with System Gradient -->
                    <div style="background: linear-gradient(90deg, #559CDA 0%, #7BADFF 27%, #FFB58D 76%, #ED8028 100%); padding: 24px; border-radius: 12px 12px 0 0; position: relative;">
                        <h2 style="color: white; font-size: 22px; font-weight: 700; margin: 0; letter-spacing: 0.5px;">How to Get App Password</h2>
                        <p style="color: rgba(255,255,255,0.9); font-size: 13px; margin: 6px 0 0 0; font-weight: 400;">Step-by-step guide to generate your Gmail app password</p>
                        <button type="button" onclick="closeAppPasswordGuideModal()" style="position: absolute; top: 16px; right: 16px; background: rgba(255,255,255,0.2); border: none; font-size: 24px; cursor: pointer; color: white; width: 32px; height: 32px; border-radius: 6px; display: flex; align-items: center; justify-content: center; transition: background 0.2s;" onmouseover="this.style.background='rgba(255,255,255,0.3);'" onmouseout="this.style.background='rgba(255,255,255,0.2);'">×</button>
                    </div>
                    
                    <!-- Content -->
                    <div style="padding: 24px; font-size: 14px; color: #333; line-height: 1.6;">
                        

                        <h3 style="font-size: 15px; font-weight: 600; color: #1f2937; margin-bottom: 12px; padding-bottom: 8px; border-bottom: 2px solid #e5e7eb;">Step 1: Enable 2-Step Verification</h3>
                        <ol style="margin: 0 0 20px 0; padding-left: 20px; color: #374151;">
                            <li style="margin-bottom: 10px;">Go to <a href="https://myaccount.google.com" target="_blank" style="color: #0ea5e9; text-decoration: none; font-weight: 600;">myaccount.google.com</a></li>
                            
                            <!-- IMAGE TEMPLATE FOR STEP 1 - Change "step1.png" to your image filename -->
                        <div style="margin: 16px 0; padding: 12px; background: #f3f4f6; border-radius: 6px; border: 1px solid #e5e7eb;">
                            <img src="../assets/app-pass-manual-pictures/step1.1.png" alt="Enable 2-Step Verification" style="max-width: 100%; height: auto; border-radius: 6px; border: 1px solid #d1d5db;">
                        </div>
                        
                        <li style="margin-bottom: 10px;">Click <strong>Security & sign-in</strong> in the left sidebar</li>
                        <div style="margin: 16px 0; padding: 12px; background: #f3f4f6; border-radius: 6px; border: 1px solid #e5e7eb;">
                            <img src="../assets/app-pass-manual-pictures/step1.2.png" alt="Enable 2-Step Verification" style="max-width: 100%; height: auto; border-radius: 6px; border: 1px solid #d1d5db;">
                        </div>
                            <li style="margin-bottom: 10px;">Look for <strong>2-Step Verification</strong></li>
                            <div style="margin: 16px 0; padding: 12px; background: #f3f4f6; border-radius: 6px; border: 1px solid #e5e7eb;">
                            <img src="../assets/app-pass-manual-pictures/step1.3.png" alt="Enable 2-Step Verification" style="max-width: 100%; height: auto; border-radius: 6px; border: 1px solid #d1d5db;">
                        </div>
                            <li style="margin-bottom: 10px;">If not enabled, click <strong>Enable 2-Step Verification</strong> and follow the prompts</li>
                            <div style="margin: 16px 0; padding: 12px; background: #f3f4f6; border-radius: 6px; border: 1px solid #e5e7eb;">
                            <img src="../assets/app-pass-manual-pictures/step1.4.png" alt="Enable 2-Step Verification" style="max-width: 100%; height: auto; border-radius: 6px; border: 1px solid #d1d5db;">
                        </div>
                        </ol>
                        

                        <h3 style="font-size: 15px; font-weight: 600; color: #1f2937; margin-top: 24px; margin-bottom: 12px; padding-bottom: 8px; border-bottom: 2px solid #e5e7eb;">Step 2: Generate App Password</h3>
                        <ol style="margin: 0 0 20px 0; padding-left: 20px; color: #374151;">
                            <li style="margin-bottom: 10px;">Once, 2-step verification is enabled, type "App Passwords" in the search bar (only appears after 2FA is enabled)</li>
                            <div style="margin: 16px 0; padding: 12px; background: #f3f4f6; border-radius: 6px; border: 1px solid #e5e7eb;">
                            <img src="../assets/app-pass-manual-pictures/step2.1.png" alt="Enable 2-Step Verification" style="max-width: 100%; height: auto; border-radius: 6px; border: 1px solid #d1d5db;">
                        </div>
                            <li style="margin-bottom: 10px;">Type a name for the app password (e.g., "Smart Events"), then click <strong>Create</strong>.</li>
                            <div style="margin: 16px 0; padding: 12px; background: #f3f4f6; border-radius: 6px; border: 1px solid #e5e7eb;">
                            <img src="../assets/app-pass-manual-pictures/step2.2.png" alt="Enable 2-Step Verification" style="max-width: 100%; height: auto; border-radius: 6px; border: 1px solid #d1d5db;">
                        </div>
                            <li style="margin-bottom: 10px;">Google will generate a 16-character password. Copy the password </li>
                            <div style="margin: 16px 0; padding: 12px; background: #f3f4f6; border-radius: 6px; border: 1px solid #e5e7eb;">
                            <img src="../assets/app-pass-manual-pictures/step2.3.png" alt="Enable 2-Step Verification" style="max-width: 100%; height: auto; border-radius: 6px; border: 1px solid #d1d5db;">
                        </div>
                        </ol>
                    
                        <h3 style="font-size: 15px; font-weight: 600; color: #1f2937; margin-top: 24px; margin-bottom: 12px; padding-bottom: 8px; border-bottom: 2px solid #e5e7eb;">Step 3: Paste into Smart Events</h3>
                        <ol style="margin: 0 0 20px 0; padding-left: 20px; color: #374151;">
                            <li style="margin-bottom: 10px;">Return to this page and paste the 16-character password in the <strong>App Password</strong> field</li>
                                                   </ol>

                        <div style="margin-top: 24px; padding: 12px; background: linear-gradient(135deg, #fef3c7 0%, #fef08a 100%); border-left: 4px solid #f59e0b; border-radius: 4px; box-shadow: 0 2px 4px rgba(245, 158, 11, 0.1);">
                            <p style="margin: 0; color: #92400e; font-size: 13px; font-weight: 600; display: flex; align-items: center; gap: 8px;">
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                    <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3.05h16.94a2 2 0 0 0 1.71-3.05L13.71 3.86a2 2 0 0 0-3.42 0z"></path><line x1="12" y1="9" x2="12" y2="13"></line><line x1="12" y1="17" x2="12.01" y2="17"></line>
                                </svg>
                                Never share your app password with anyone. Keep it as secret as your regular Gmail password.
                            </p>
                        </div>
                    </div>

                    <!-- Footer -->
                    <div style="padding: 16px 24px; border-top: 1px solid #e5e7eb; background-color: #f9fafb; border-radius: 0 0 12px 12px; display: flex; gap: 8px; justify-content: flex-end;">
                        <button onclick="closeAppPasswordGuideModal()" style="padding: 10px 24px; background: linear-gradient(90deg, #559CDA 0%, #7BADFF 27%, #FFB58D 76%, #ED8028 100%); color: white; border: none; border-radius: 6px; cursor: pointer; font-weight: 600; font-size: 13px; transition: opacity 0.2s;" onmouseover="this.style.opacity='0.9';" onmouseout="this.style.opacity='1';">Got It</button>
                    </div>
                </div>
            </div>
        `;
        
        // Append modal to body
        document.body.insertAdjacentHTML('beforeend', modalHTML);
    }
});

/* Open the app password guide modal*/
function openAppPasswordGuideModal() {
    const modal = document.getElementById('appPasswordGuideModal');
    if (modal) {
        modal.classList.add('active');
        // Scroll modal content to the top
        const modalContent = modal.querySelector('.modal-content');
        if (modalContent) {
            modalContent.scrollTop = 0;
        }
    }
}

/* Close the app password guide modal */
function closeAppPasswordGuideModal() {
    const modal = document.getElementById('appPasswordGuideModal');
    if (modal) {
        modal.classList.remove('active');
    }
}
